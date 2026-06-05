# Stories (Instagram-style) — personal, single-author

Date: 2026-06-05
Branch: `perf/static-rendering-client-auth` (feature will get its own branch at implementation)

## Problem / Goal

Add an Instagram-style "Stories" feature to the personal blog. Single-author
(owner only) content, just like posts — there is no user-generated story upload,
no moderation, no per-user state on the server. The owner authors stories as
**typed TypeScript objects** in the repo and drops **video/image files directly
into the repo** (`public/`).

The feature must preserve the site's hard-won **fully static rendering** model
(recent work made home/categories/posts SSG with client-side auth/comments). So:
no new server route, no API, no Supabase, no per-request work. Story data is a
build-time constant; all interaction is client-side after hydration.

## Decisions (locked during brainstorming)

| Question | Decision |
|----------|----------|
| Lifecycle | **Nothing is deleted.** Rings split into **Active** and **Expired** sections by age. Expiry is **group-level, age-based**: a ring expires `activeWindowMs` after its `createdAt` (default 24h; optional per-group override). Expired rings stay fully viewable in the Archive section. No server "seen" state. |
| Classification timing | **Client-side at runtime** (`Date.now()`), not build time — so a ring moves Active→Expired on its own without a redeploy, while the home page stays statically rendered. |
| Media per item | **Mixed** — each item is an image OR a video. |
| Grouping | **Rings/groups like IG** — top row of circles; each ring contains an ordered sequence of items. |
| Entry point | **Top of home page.** Active rings as a circles row above `HeroPost`; an **Expired/Archive** section below it on the same page. (No separate `/stories` route for now.) |
| Player fidelity | **Full IG-fidelity** — segmented progress bars, auto-advance, tap-zones, hold-to-pause, cross-ring nav, keyboard + Esc. |
| Data source | **Typed object array** (`src/data/stories.ts`), NOT markdown. Author edits this file. |
| Dependencies | **No new runtime dependency.** No story player library. |

### Out of scope (YAGNI)

Comments/reactions on stories, **true deletion** of expired stories (they move to
Archive, never disappear), a dedicated `/stories` route, server-side view counts,
deep-link/share URLs, story-creation UI. All are easy follow-ups; none are built
now.

## Architecture

```
src/data/stories.ts            (author edits — typed object array, build-time constant)
public/assets/stories/<group>/ (video + image files dropped in directly)

src/interfaces/story.ts        (shared types)

src/app/[locale]/_components/stories/
  story-bar.tsx          client — Active circles row + Expired archive section, opens viewer
  story-viewer.tsx       client — fullscreen overlay player (portal)
  story-progress.tsx     presentational — segmented progress bars
  story-player.ts        PURE reducer + types (no React, no DOM) — unit-tested
  use-story-player.ts    React hook — wraps reducer, owns timers + video events
  story-sections.ts      PURE splitStorySections(groups, now, defaultWindow) — unit-tested
  use-story-sections.ts  React hook — client-side now/mounted, returns {active,expired}
  story-player.test.ts   node:test unit tests for reducer + splitStorySections

src/app/[locale]/page.tsx      (+) render <StoryBar stories={stories} locale={locale} />
src/i18n/dictionaries.ts       (+) story UI labels (aria, close, prev/next)
```

### 1. Data model — `src/interfaces/story.ts`

```ts
import { Locale } from "@/i18n/config";

export type Localized = Record<Locale, string>; // { vi: string; en: string }

type StoryItemBase = {
    id: string;            // unique within its group
    caption?: Localized;   // optional overlay text
    createdAt: string;     // ISO; used for ordering/labels
};

export type StoryImageItem = StoryItemBase & {
    type: "image";
    src: string;           // e.g. /assets/stories/grad-2026/photo-1.webp
    durationMs?: number;   // default DEFAULT_IMAGE_DURATION_MS (5000)
};

export type StoryVideoItem = StoryItemBase & {
    type: "video";
    src: string;           // e.g. /assets/stories/grad-2026/clip.mp4 (in public/)
    poster?: string;       // thumbnail while loading / for reduced-motion
    // playback duration derived from the <video> element at runtime
};

export type StoryItem = StoryImageItem | StoryVideoItem;

export type StoryGroup = {
    id: string;            // unique; used as the ring key
    title: Localized;      // ring label under the circle
    cover: string;         // circle thumbnail image
    items: StoryItem[];    // ordered; played front-to-back
    createdAt: string;     // ISO; expiry + ordering anchor (rings sorted desc)
    activeForMs?: number;  // optional override of the default active window
};

export const DEFAULT_ACTIVE_WINDOW_MS = 24 * 60 * 60 * 1000; // 24h
```

A ring is **active** when `now - Date.parse(createdAt) < (activeForMs ??
DEFAULT_ACTIVE_WINDOW_MS)`, else **expired**. Computed client-side (see §2a).

`src/data/stories.ts` exports `export const stories: StoryGroup[] = [ ... ]`,
sorted (or sorted at read time) newest-first. This is the only file the owner
edits to add content. Validation note: a small `assertStoriesValid(stories)`
guard (unique ids, non-empty items, known media type) runs in dev/build to catch
authoring typos early — pure function, also unit-tested. No Zod needed (data is
typed at the source, unlike markdown frontmatter).

### 1a. Active/expired classification — `story-sections.ts` + `use-story-sections.ts`

Pure function (framework-free, unit-tested):

```ts
export function splitStorySections(
    groups: StoryGroup[],
    now: number,
    defaultWindowMs = DEFAULT_ACTIVE_WINDOW_MS,
): { active: StoryGroup[]; expired: StoryGroup[] };
// each list sorted by createdAt desc (newest first)
// boundary: elapsed >= window => expired (strict: exactly-at-window is expired)
```

Because the home page is **statically rendered**, `now` cannot be baked at build
time (the page would freeze the Active/Expired split until the next deploy). So
the split is computed **on the client** via `use-story-sections.ts`:

- `mounted` starts `false`; a `useEffect` flips it `true` and reads `Date.now()`.
- **Before mount** (SSR output + first client render): render a deterministic
  baseline — all rings in the Active row, sorted by `createdAt` desc, no Expired
  heading. This keeps server and first-client HTML identical (no hydration
  mismatch); the container carries `suppressHydrationWarning` as a belt-and-braces
  (same approach as the repo's `DateFormatter`, commit 35a0be3).
- **After mount:** recompute with real `now`, render Active circles + Expired
  archive section. The one-frame reconciliation is acceptable and invisible in
  practice.

This keeps the static-rendering guarantee intact while letting rings expire on
their own clock without a redeploy.

### 2. Pure player core — `story-player.ts`

A framework-free reducer so the navigation logic is unit-testable without React
or a DOM. This is the testability lever called out in CLAUDE.md (TDD; never
commit untested code).

```ts
export type PlayerState = {
    open: boolean;
    groupIndex: number;   // index into groups[]
    itemIndex: number;    // index into groups[groupIndex].items[]
    paused: boolean;
    progress: number;     // 0..1 for the current item (driven by TICK)
};

export type PlayerAction =
    | { type: "OPEN"; groupIndex: number; itemIndex?: number }
    | { type: "CLOSE" }
    | { type: "NEXT" }            // next item; past last item -> next group; past last group -> CLOSE
    | { type: "PREV" }            // prev item; before first -> prev group's last item; clamp at very start
    | { type: "TICK"; delta: number } // advance progress; auto-NEXT when >= 1
    | { type: "PAUSE" }
    | { type: "RESUME" }
    | { type: "SET_PROGRESS"; value: number }; // video timeupdate sync

export function reducer(
    groups: StoryGroup[],
    state: PlayerState,
    action: PlayerAction,
): PlayerState;
```

Edge rules made explicit (to kill ambiguity for tests):
- `NEXT` on the last item of the last group → `CLOSE` (state.open = false).
- `PREV` on the first item of the first group → stay (clamp), reset progress to 0.
- `PREV` mid-group goes to previous item; at a group boundary goes to the
  previous group's **last** item.
- Any group/item change resets `progress` to 0 and `paused` to false.
- `TICK` accumulates into `progress`; when it reaches 1 the reducer emits the
  same transition as `NEXT` (single source of truth for advancement).

### 3. React hook — `use-story-player.ts`

Wraps `useReducer(reducer-bound-to-groups)`. Owns the side effects the pure core
deliberately excludes:
- **Image items:** `requestAnimationFrame`/interval loop dispatching `TICK`
  with elapsed delta vs `durationMs` (default 5000). Respects `paused`.
- **Video items:** no timer; listen to the `<video>` `timeupdate` →
  `SET_PROGRESS`, and `ended` → `NEXT`. `loadedmetadata` gives duration for the
  progress bar.
- **Hold-to-pause:** pointer-down dispatches `PAUSE`, pointer-up `RESUME`
  (also pauses the `<video>` element).
- **`prefers-reduced-motion`:** disable the auto-advance timer; user advances
  by tapping. Videos render with `controls`-less but `muted playsInline`, and
  if reduced-motion, show `poster` and require tap to play.

### 4. UI components

- **`story-bar.tsx`** (client): receives `stories` + `locale` as props, calls
  `use-story-sections` to get `{ active, expired }`.
  - **Active**: horizontal scroll row of circular `cover` thumbnails with `title`
    beneath (the classic IG row).
  - **Expired/Archive**: a labelled section below (heading from the dictionary,
    e.g. "Archive"). Rendered only when `expired.length > 0`; styled distinctly
    (e.g. muted/desaturated circles) so it reads as past.
  - Clicking a ring opens the viewer **scoped to its own section**: the viewer
    receives that section's `StoryGroup[]` plus the clicked index, so auto-advance
    walks the active set or the archive set, then closes at the section's end (it
    does not bleed across the Active/Expired boundary).
  - Optional greyed "seen" styling read from `localStorage` (client-only, keeps
    page static; purely cosmetic).
- **`story-viewer.tsx`** (client): full-screen overlay rendered via
  `createPortal` to `document.body`. Layout: progress bars (top), close button,
  media stage (image `<img>` or `<video>`), caption overlay (bottom), invisible
  left/right tap-zones. Focus-trapped while open; `Esc` closes; `←/→` arrows
  navigate; swipe-down (touch) closes. Body scroll locked while open.
- **`story-progress.tsx`** (presentational): one segment per item in the active
  group; filled = past, animated = current (`progress`), empty = future.

### 5. Integration into the static home page

`src/app/[locale]/page.tsx` (server component, already static) imports the
build-time constant and renders the bar at the top of the existing `Container`,
above `HeroPost`:

```tsx
import { stories } from "@/data/stories";
import { StoryBar } from "@/app/[locale]/_components/stories/story-bar";
// ...
<Container>
    {/* json-ld scripts unchanged */}
    <StoryBar stories={stories} locale={locale} />
    <HeroPost ... />
    {morePosts.length > 0 && <MoreStories ... />}
</Container>
```

`stories` is serializable plain data → passes cleanly server→client. `page.tsx`
keeps `generateStaticParams`; no `cookies()`, no fetch, no dynamic opt-in. Static
rendering is fully preserved. If `stories` is empty, `StoryBar` renders nothing.

### 6. i18n

Captions/titles are `Localized` objects; components index by the `[locale]`
route param already in scope (`stories.title[locale]`). Static UI strings (aria
labels, "Close", "Previous"/"Next", a section heading like "Stories") are added
to `src/i18n/dictionaries.ts` for `vi` and `en`, matching the existing dictionary
shape.

### 7. Accessibility & mobile

- Keyboard: `←/→` prev/next, `Esc` close, `Space` pause/resume; viewer is
  focus-trapped and restores focus to the originating ring on close.
- `aria-label`s on tap-zones and controls; `role="dialog"` + `aria-modal` on the
  overlay.
- `prefers-reduced-motion`: auto-advance off (tap to advance), video shows poster.
- Video: `muted playsInline` so mobile Safari/Chrome autoplay works; `poster`
  fallback; `preload="metadata"`.

## Testing

The repo has **no test runner** installed. Per CLAUDE.md (TDD, never commit
untested) and "no new dependency without asking", the plan is:

- **Zero-new-dependency unit tests** using Node's built-in `node:test` +
  `node:assert`, with TypeScript loaded through the **already-present `jiti`**
  (used by existing `scripts/`). Add a `"test"` npm script.
- **Unit-tested (pure, no React/DOM):**
  - `reducer` — NEXT within group; NEXT across group boundary; NEXT past last
    group → CLOSE; PREV clamp at very start; PREV across boundary → prev group's
    last item; TICK reaching 1 advances; PAUSE/RESUME; progress reset on item
    change.
  - `splitStorySections` — ring inside window → active; past window → expired;
    exactly-at-window → expired (strict boundary); per-group `activeForMs`
    override; each list sorted newest-first; empty input → empty lists.
  - `assertStoriesValid` — duplicate ids, empty items, unknown media type.
- **Manual / visual verification** (no DOM test runner without a new dep): the
  viewer overlay, tap-zones, video autoplay, and reduced-motion behavior are
  verified by running the dev server and exercising the UI (evidence captured per
  the iron-law verification rule).

Fallback: if `node:test` + `jiti` proves unworkable for the TS reducer tests,
adding `vitest` will be surfaced as an explicit ask before proceeding — not done
silently.

## Risks / notes

- **Video file size**: large `.mp4` in the repo bloats git and the deploy. Note
  for the owner; recommend short, compressed clips (mirrors the existing
  `compress-images` discipline). Not solved by code here.
- **React 19 portals + body scroll lock**: standard, low risk.
- **Static guarantee**: the one thing that must not regress. The home page must
  remain in the static build output — verified post-implementation via
  `next build` output (route marked static, not ƒ dynamic).
