# Stories Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an Instagram-style, single-author Stories feature to the blog — IG-style rings on the home page, split into Active and Expired sections, with a full-screen auto-advancing viewer for mixed image/video items.

**Architecture:** Story content is a typed object array (`src/data/stories.ts`); media files live in `public/assets/stories/`. Pure, framework-free logic (the player reducer + the active/expired split) lives in `src/lib/stories/` and is unit-tested with Node's built-in `node:test` run through the already-installed `jiti` (zero new dependencies). React components live in `src/app/[locale]/_components/stories/`. The home page stays statically rendered: `stories` is a build-time constant passed to a client `StoryBar`; the Active/Expired classification is computed client-side at runtime so rings expire without a redeploy.

**Tech Stack:** Next.js App Router (static), React 19, TypeScript, Tailwind CSS, `classnames`, `node:test` + `jiti` for unit tests.

**Spec:** `docs/superpowers/specs/2026-06-05-stories-feature-design.md`

**Branch:** `feat/stories` (already created).

---

## File Structure

| File | Responsibility |
|------|----------------|
| `src/interfaces/story.ts` | **Create** — shared types: `Localized`, `StoryItem`, `StoryGroup`. Types only. |
| `src/lib/stories/story-sections.ts` | **Create** — pure: `DEFAULT_ACTIVE_WINDOW_MS`, `splitStorySections`, `assertStoriesValid`. Type-only `@/` imports. |
| `src/lib/stories/story-sections.test.ts` | **Create** — `node:test` unit tests. |
| `src/lib/stories/story-player.ts` | **Create** — pure: `PlayerState`, `PlayerAction`, `createInitialState`, `reducer`, `DEFAULT_IMAGE_DURATION_MS`. Type-only `@/` imports. |
| `src/lib/stories/story-player.test.ts` | **Create** — `node:test` unit tests. |
| `src/data/stories.ts` | **Create** — the owner-authored story data (ships empty; real entries added by owner). |
| `src/i18n/dictionaries.ts` | **Modify** — add `story` label group to `Dictionary` type + `vi`/`en`; export `StoryLabels`. |
| `src/app/[locale]/_components/stories/use-story-sections.ts` | **Create** — client hook: mounted/`now` → `{active, expired, ready}`. |
| `src/app/[locale]/_components/stories/use-story-player.ts` | **Create** — client hook: wraps reducer, owns image timer + reduced-motion. |
| `src/app/[locale]/_components/stories/story-progress.tsx` | **Create** — presentational segmented progress bars. |
| `src/app/[locale]/_components/stories/story-viewer.tsx` | **Create** — full-screen overlay player. |
| `src/app/[locale]/_components/stories/story-bar.tsx` | **Create** — Active circles row + Expired archive section; opens viewer. |
| `src/app/[locale]/page.tsx` | **Modify** — render `<StoryBar>` above `<HeroPost>`. |
| `package.json` | **Modify** — add `test` script. |

**Why pure logic in `src/lib/stories/` (not under `[locale]/`):** matches the repo's existing `src/lib/` convention (`api.ts`, `post-html.ts`, `search-posts.ts`), and — critically — Node's `--test` glob treats `[locale]` as a character class, so test files must live in a bracket-free path. Verified working: `node --import jiti/register --test "src/lib/stories/*.test.ts"`.

**jiti constraint (verified):** under the test runtime the `@/` alias does **not** resolve for value imports, but `import type { ... } from "@/..."` is erased by esbuild before runtime. So the pure files import cross-module **types** via `@/` and define their own runtime constants; test files import the pure modules via **relative** paths.

---

### Task 1: Add the test script (zero new dependencies)

**Files:**
- Modify: `package.json:3-10` (the `scripts` block)

- [ ] **Step 1: Add the `test` script**

In `package.json`, add a `test` entry to `scripts`:

```json
    "scripts": {
        "dev": "next dev --turbopack",
        "lint": "eslint .",
        "build": "next build",
        "start": "next start",
        "test": "node --import jiti/register --test \"src/lib/stories/*.test.ts\"",
        "new-post": "jiti scripts/new-post.ts",
        "compress-images": "jiti scripts/compress-images.ts"
    },
```

- [ ] **Step 2: Verify the runner works on an empty match**

Run: `npm test`
Expected: exits cleanly (Node reports `# tests 0` or "no test files found"); exit code 0. (No test files exist yet — this just confirms the command is wired.)

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "chore(stories): add node:test runner via jiti (no new deps)

Refs: docs/superpowers/plans/2026-06-05-stories-feature.md"
```

---

### Task 2: Story types

**Files:**
- Create: `src/interfaces/story.ts`

- [ ] **Step 1: Create the types file**

```ts
import type { Locale } from "@/i18n/config";

export type Localized = Record<Locale, string>;

type StoryItemBase = {
    id: string;
    caption?: Localized;
    createdAt: string; // ISO 8601
};

export type StoryImageItem = StoryItemBase & {
    type: "image";
    src: string; // e.g. /assets/stories/grad-2026/photo-1.webp
    durationMs?: number;
};

export type StoryVideoItem = StoryItemBase & {
    type: "video";
    src: string; // e.g. /assets/stories/grad-2026/clip.mp4 (in public/)
    poster?: string;
};

export type StoryItem = StoryImageItem | StoryVideoItem;

export type StoryGroup = {
    id: string;
    title: Localized;
    cover: string; // circle thumbnail
    items: StoryItem[];
    createdAt: string; // ISO 8601 — expiry + ordering anchor
    activeForMs?: number; // optional override of the default active window
};
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS (no errors).

- [ ] **Step 3: Commit**

```bash
git add src/interfaces/story.ts
git commit -m "feat(stories): add Story types

Refs: docs/superpowers/plans/2026-06-05-stories-feature.md"
```

---

### Task 3: Active/expired split + validation (pure, TDD)

**Files:**
- Create: `src/lib/stories/story-sections.ts`
- Test: `src/lib/stories/story-sections.test.ts`

- [ ] **Step 1: Write the failing test**

`src/lib/stories/story-sections.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import {
    DEFAULT_ACTIVE_WINDOW_MS,
    splitStorySections,
    assertStoriesValid,
} from "./story-sections.ts";

const HOUR = 60 * 60 * 1000;
const NOW = Date.parse("2026-06-05T12:00:00.000Z");

function group(id: string, ageHours: number, activeForMs?: number) {
    return {
        id,
        title: { vi: id, en: id },
        cover: `/c/${id}.webp`,
        createdAt: new Date(NOW - ageHours * HOUR).toISOString(),
        activeForMs,
        items: [
            { id: `${id}-1`, type: "image" as const, src: `/s/${id}/1.webp`, createdAt: new Date(NOW).toISOString() },
        ],
    };
}

test("default window is 24h", () => {
    assert.equal(DEFAULT_ACTIVE_WINDOW_MS, 24 * HOUR);
});

test("ring inside the window is active, past it is expired", () => {
    const { active, expired } = splitStorySections([group("fresh", 1), group("old", 30)], NOW);
    assert.deepEqual(active.map((g) => g.id), ["fresh"]);
    assert.deepEqual(expired.map((g) => g.id), ["old"]);
});

test("exactly at the window boundary is expired (strict)", () => {
    const { active, expired } = splitStorySections([group("edge", 24)], NOW);
    assert.equal(active.length, 0);
    assert.deepEqual(expired.map((g) => g.id), ["edge"]);
});

test("per-group activeForMs overrides the default", () => {
    // 30h old but allowed 48h -> still active
    const { active } = splitStorySections([group("long", 30, 48 * HOUR)], NOW);
    assert.deepEqual(active.map((g) => g.id), ["long"]);
});

test("each list is sorted newest-first", () => {
    const { active } = splitStorySections([group("a", 5), group("b", 1), group("c", 3)], NOW);
    assert.deepEqual(active.map((g) => g.id), ["b", "c", "a"]);
});

test("empty input yields empty lists", () => {
    assert.deepEqual(splitStorySections([], NOW), { active: [], expired: [] });
});

test("assertStoriesValid throws on duplicate group id", () => {
    assert.throws(() => assertStoriesValid([group("dup", 1), group("dup", 2)]), /duplicate group id/i);
});

test("assertStoriesValid throws on empty items", () => {
    const g = { ...group("empty", 1), items: [] };
    assert.throws(() => assertStoriesValid([g]), /no items/i);
});

test("assertStoriesValid accepts a valid set", () => {
    assert.doesNotThrow(() => assertStoriesValid([group("ok", 1)]));
});
```

- [ ] **Step 2: Run the test, verify it fails**

Run: `npm test`
Expected: FAIL — `Cannot find module './story-sections.ts'` (module not created yet).

- [ ] **Step 3: Implement the module**

`src/lib/stories/story-sections.ts`:

```ts
import type { StoryGroup } from "@/interfaces/story";

export const DEFAULT_ACTIVE_WINDOW_MS = 24 * 60 * 60 * 1000;

function byCreatedAtDesc(a: StoryGroup, b: StoryGroup): number {
    return Date.parse(b.createdAt) - Date.parse(a.createdAt);
}

function windowFor(group: StoryGroup, defaultWindowMs: number): number {
    return typeof group.activeForMs === "number" ? group.activeForMs : defaultWindowMs;
}

export function splitStorySections(
    groups: StoryGroup[],
    now: number,
    defaultWindowMs: number = DEFAULT_ACTIVE_WINDOW_MS,
): { active: StoryGroup[]; expired: StoryGroup[] } {
    const active: StoryGroup[] = [];
    const expired: StoryGroup[] = [];
    for (const group of groups) {
        const elapsed = now - Date.parse(group.createdAt);
        if (elapsed >= windowFor(group, defaultWindowMs)) {
            expired.push(group);
        } else {
            active.push(group);
        }
    }
    active.sort(byCreatedAtDesc);
    expired.sort(byCreatedAtDesc);
    return { active, expired };
}

export function assertStoriesValid(groups: StoryGroup[]): void {
    const seenGroupIds = new Set<string>();
    for (const group of groups) {
        if (seenGroupIds.has(group.id)) {
            throw new Error(`Invalid stories: duplicate group id "${group.id}"`);
        }
        seenGroupIds.add(group.id);

        if (group.items.length === 0) {
            throw new Error(`Invalid stories: group "${group.id}" has no items`);
        }

        const seenItemIds = new Set<string>();
        for (const item of group.items) {
            if (seenItemIds.has(item.id)) {
                throw new Error(`Invalid stories: duplicate item id "${item.id}" in group "${group.id}"`);
            }
            seenItemIds.add(item.id);
            if (item.type !== "image" && item.type !== "video") {
                throw new Error(`Invalid stories: item "${item.id}" has unknown type`);
            }
        }
    }
}
```

- [ ] **Step 4: Run the test, verify it passes**

Run: `npm test`
Expected: PASS — `# pass 9`, `# fail 0`.

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/stories/story-sections.ts src/lib/stories/story-sections.test.ts
git commit -m "feat(stories): active/expired split + validation (pure, tested)

Refs: docs/superpowers/plans/2026-06-05-stories-feature.md"
```

---

### Task 4: Player reducer (pure, TDD)

**Files:**
- Create: `src/lib/stories/story-player.ts`
- Test: `src/lib/stories/story-player.test.ts`

Edge rules (single source of truth — `TICK` reaching 1 reuses the `NEXT` transition):
- `NEXT` past the last item of the last group → `CLOSE` (`open=false`).
- `PREV` at the very first item of the first group → clamp (stay), reset progress.
- `PREV` at a group boundary → previous group's **last** item.
- Any group/item change resets `progress=0`, `paused=false`.

- [ ] **Step 1: Write the failing test**

`src/lib/stories/story-player.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { createInitialState, reducer } from "./story-player.ts";

function img(id: string) {
    return { id, type: "image" as const, src: `/${id}.webp`, createdAt: "2026-06-05T00:00:00.000Z" };
}
// group A: 2 items, group B: 1 item
const GROUPS = [
    { id: "A", title: { vi: "A", en: "A" }, cover: "/a.webp", createdAt: "2026-06-05T00:00:00.000Z", items: [img("a1"), img("a2")] },
    { id: "B", title: { vi: "B", en: "B" }, cover: "/b.webp", createdAt: "2026-06-04T00:00:00.000Z", items: [img("b1")] },
];
const r = (state: ReturnType<typeof createInitialState>, action: Parameters<typeof reducer>[2]) =>
    reducer(GROUPS, state, action);

test("initial state is closed at 0/0", () => {
    assert.deepEqual(createInitialState(), { open: false, groupIndex: 0, itemIndex: 0, paused: false, progress: 0 });
});

test("OPEN sets open + indices and resets progress", () => {
    const s = r(createInitialState(), { type: "OPEN", groupIndex: 1 });
    assert.deepEqual(s, { open: true, groupIndex: 1, itemIndex: 0, paused: false, progress: 0 });
});

test("OPEN honors an explicit itemIndex", () => {
    const s = r(createInitialState(), { type: "OPEN", groupIndex: 0, itemIndex: 1 });
    assert.equal(s.itemIndex, 1);
});

test("NEXT advances within a group", () => {
    const open = r(createInitialState(), { type: "OPEN", groupIndex: 0 });
    const s = r(open, { type: "NEXT" });
    assert.deepEqual([s.groupIndex, s.itemIndex], [0, 1]);
});

test("NEXT past last item moves to next group, item 0", () => {
    let s = r(createInitialState(), { type: "OPEN", groupIndex: 0, itemIndex: 1 });
    s = r(s, { type: "NEXT" });
    assert.deepEqual([s.groupIndex, s.itemIndex], [1, 0]);
});

test("NEXT past last item of last group closes", () => {
    let s = r(createInitialState(), { type: "OPEN", groupIndex: 1, itemIndex: 0 });
    s = r(s, { type: "NEXT" });
    assert.equal(s.open, false);
});

test("PREV within a group goes back", () => {
    let s = r(createInitialState(), { type: "OPEN", groupIndex: 0, itemIndex: 1 });
    s = r(s, { type: "PREV" });
    assert.deepEqual([s.groupIndex, s.itemIndex], [0, 0]);
});

test("PREV at group boundary goes to previous group's last item", () => {
    let s = r(createInitialState(), { type: "OPEN", groupIndex: 1, itemIndex: 0 });
    s = r(s, { type: "PREV" });
    assert.deepEqual([s.groupIndex, s.itemIndex], [0, 1]);
});

test("PREV at very start clamps and resets progress", () => {
    let s = r(createInitialState(), { type: "OPEN", groupIndex: 0, itemIndex: 0 });
    s = { ...s, progress: 0.5 };
    s = r(s, { type: "PREV" });
    assert.deepEqual([s.groupIndex, s.itemIndex, s.progress], [0, 0, 0]);
});

test("TICK accumulates progress", () => {
    let s = r(createInitialState(), { type: "OPEN", groupIndex: 0 });
    s = r(s, { type: "TICK", delta: 0.3 });
    assert.equal(s.progress, 0.3);
});

test("TICK reaching 1 advances like NEXT", () => {
    let s = r(createInitialState(), { type: "OPEN", groupIndex: 0, itemIndex: 0 });
    s = r(s, { type: "TICK", delta: 1 });
    assert.deepEqual([s.groupIndex, s.itemIndex, s.progress], [0, 1, 0]);
});

test("PAUSE / RESUME toggle the flag", () => {
    let s = r(createInitialState(), { type: "OPEN", groupIndex: 0 });
    s = r(s, { type: "PAUSE" });
    assert.equal(s.paused, true);
    s = r(s, { type: "RESUME" });
    assert.equal(s.paused, false);
});

test("SET_PROGRESS sets an absolute value (clamped 0..1)", () => {
    let s = r(createInitialState(), { type: "OPEN", groupIndex: 0 });
    s = r(s, { type: "SET_PROGRESS", value: 0.7 });
    assert.equal(s.progress, 0.7);
    s = r(s, { type: "SET_PROGRESS", value: 2 });
    assert.equal(s.progress, 1);
});

test("CLOSE closes", () => {
    let s = r(createInitialState(), { type: "OPEN", groupIndex: 0 });
    s = r(s, { type: "CLOSE" });
    assert.equal(s.open, false);
});
```

- [ ] **Step 2: Run the test, verify it fails**

Run: `npm test`
Expected: FAIL — `Cannot find module './story-player.ts'`.

- [ ] **Step 3: Implement the reducer**

`src/lib/stories/story-player.ts`:

```ts
import type { StoryGroup } from "@/interfaces/story";

export const DEFAULT_IMAGE_DURATION_MS = 5000;

export type PlayerState = {
    open: boolean;
    groupIndex: number;
    itemIndex: number;
    paused: boolean;
    progress: number; // 0..1 for the current item
};

export type PlayerAction =
    | { type: "OPEN"; groupIndex: number; itemIndex?: number }
    | { type: "CLOSE" }
    | { type: "NEXT" }
    | { type: "PREV" }
    | { type: "TICK"; delta: number }
    | { type: "PAUSE" }
    | { type: "RESUME" }
    | { type: "SET_PROGRESS"; value: number };

export function createInitialState(): PlayerState {
    return { open: false, groupIndex: 0, itemIndex: 0, paused: false, progress: 0 };
}

const CLOSED: PlayerState = { open: false, groupIndex: 0, itemIndex: 0, paused: false, progress: 0 };

function clamp01(value: number): number {
    if (value < 0) return 0;
    if (value > 1) return 1;
    return value;
}

function goNext(groups: StoryGroup[], state: PlayerState): PlayerState {
    const group = groups[state.groupIndex];
    if (!group) return CLOSED;
    if (state.itemIndex + 1 < group.items.length) {
        return { ...state, itemIndex: state.itemIndex + 1, progress: 0, paused: false };
    }
    if (state.groupIndex + 1 < groups.length) {
        return { ...state, groupIndex: state.groupIndex + 1, itemIndex: 0, progress: 0, paused: false };
    }
    return CLOSED;
}

function goPrev(groups: StoryGroup[], state: PlayerState): PlayerState {
    if (state.itemIndex > 0) {
        return { ...state, itemIndex: state.itemIndex - 1, progress: 0, paused: false };
    }
    if (state.groupIndex > 0) {
        const prev = groups[state.groupIndex - 1];
        const lastItem = prev ? Math.max(0, prev.items.length - 1) : 0;
        return { ...state, groupIndex: state.groupIndex - 1, itemIndex: lastItem, progress: 0, paused: false };
    }
    return { ...state, progress: 0, paused: false }; // clamp at very start
}

export function reducer(groups: StoryGroup[], state: PlayerState, action: PlayerAction): PlayerState {
    switch (action.type) {
        case "OPEN":
            return {
                open: true,
                groupIndex: action.groupIndex,
                itemIndex: action.itemIndex ?? 0,
                paused: false,
                progress: 0,
            };
        case "CLOSE":
            return CLOSED;
        case "NEXT":
            return goNext(groups, state);
        case "PREV":
            return goPrev(groups, state);
        case "TICK": {
            const next = clamp01(state.progress + action.delta);
            if (next >= 1) return goNext(groups, state);
            return { ...state, progress: next };
        }
        case "PAUSE":
            return { ...state, paused: true };
        case "RESUME":
            return { ...state, paused: false };
        case "SET_PROGRESS":
            return { ...state, progress: clamp01(action.value) };
        default:
            return state;
    }
}
```

- [ ] **Step 4: Run the test, verify it passes**

Run: `npm test`
Expected: PASS — all `story-player` + `story-sections` tests pass, `# fail 0`.

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/stories/story-player.ts src/lib/stories/story-player.test.ts
git commit -m "feat(stories): player reducer (pure, tested)

Refs: docs/superpowers/plans/2026-06-05-stories-feature.md"
```

---

### Task 5: Story data file (ships empty — real content added by owner)

**Files:**
- Create: `src/data/stories.ts`

Per the no-mock rule, this file ships as an empty (but valid) array. The owner adds real `StoryGroup` entries and drops the referenced media into `public/assets/stories/`. The JSDoc shows the exact shape so authoring needs no other reference. `assertStoriesValid` runs at module load so authoring typos fail fast in dev/build.

- [ ] **Step 1: Create the data file**

```ts
import { assertStoriesValid } from "@/lib/stories/story-sections";
import type { StoryGroup } from "@/interfaces/story";

/**
 * Owner-authored stories. Newest groups can be in any order — the UI sorts by
 * `createdAt` descending. Media paths are relative to `public/`.
 *
 * Example:
 *   {
 *     id: "grad-2026",
 *     title: { vi: "Tốt nghiệp", en: "Graduation" },
 *     cover: "/assets/stories/grad-2026/cover.webp",
 *     createdAt: "2026-06-05T09:00:00.000Z",
 *     // activeForMs: 48 * 60 * 60 * 1000, // optional: override the 24h window
 *     items: [
 *       { id: "g1", type: "image", src: "/assets/stories/grad-2026/1.webp", createdAt: "2026-06-05T09:00:00.000Z" },
 *       { id: "g2", type: "video", src: "/assets/stories/grad-2026/clip.mp4", poster: "/assets/stories/grad-2026/clip-poster.webp", createdAt: "2026-06-05T09:01:00.000Z", caption: { vi: "Khoảnh khắc", en: "The moment" } },
 *     ],
 *   }
 */
export const stories: StoryGroup[] = [];

assertStoriesValid(stories);
```

- [ ] **Step 2: Create the media directory placeholder**

Run:
```bash
mkdir -p public/assets/stories
touch public/assets/stories/.gitkeep
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/data/stories.ts public/assets/stories/.gitkeep
git commit -m "feat(stories): empty story data file + media dir

Refs: docs/superpowers/plans/2026-06-05-stories-feature.md"
```

---

### Task 6: i18n labels

**Files:**
- Modify: `src/i18n/dictionaries.ts` — `Dictionary` type (after the `ui` block, ~line 195), the `vi` dictionary (~line 197+), the `en` dictionary, and a `StoryLabels` export.

- [ ] **Step 1: Add `story` to the `Dictionary` type**

In the `Dictionary` type, after the `ui: { ... }` block, add a sibling `story` group:

```ts
    story: {
        regionLabel: string;   // aria-label for the whole stories region
        archiveHeading: string; // heading above expired rings
        openAria: string;      // "{title}" placeholder replaced with the group title
        closeAria: string;
        prevAria: string;
        nextAria: string;
        pauseAria: string;
        playAria: string;
    };
```

- [ ] **Step 2: Add the `vi` values**

In `dictionaries.vi`, add a `story` block as a sibling of `ui`:

```ts
        story: {
            regionLabel: "Story",
            archiveHeading: "Lưu trữ",
            openAria: "Mở story: {title}",
            closeAria: "Đóng",
            prevAria: "Trước",
            nextAria: "Tiếp theo",
            pauseAria: "Tạm dừng",
            playAria: "Phát",
        },
```

- [ ] **Step 3: Add the `en` values**

In `dictionaries.en`, add the matching `story` block:

```ts
        story: {
            regionLabel: "Stories",
            archiveHeading: "Archive",
            openAria: "Open story: {title}",
            closeAria: "Close",
            prevAria: "Previous",
            nextAria: "Next",
            pauseAria: "Pause",
            playAria: "Play",
        },
```

- [ ] **Step 4: Export the `StoryLabels` type**

Near the other type exports in `dictionaries.ts` (e.g. next to `SearchDialogLabels`), add:

```ts
export type StoryLabels = Dictionary["story"];
```

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS (the `Record<Locale, Dictionary>` literal forces both `vi` and `en` to define `story`, so a missing locale fails here).

- [ ] **Step 6: Commit**

```bash
git add src/i18n/dictionaries.ts
git commit -m "feat(stories): i18n labels for stories (vi/en)

Refs: docs/superpowers/plans/2026-06-05-stories-feature.md"
```

---

### Task 7: `useStorySections` hook

**Files:**
- Create: `src/app/[locale]/_components/stories/use-story-sections.ts`

Client-side classification. SSR + first client render use the `now === null` baseline (all rings active, sorted desc) so server and client HTML match; a mount effect sets `now` and triggers the real split.

- [ ] **Step 1: Create the hook**

```ts
"use client";

import { useEffect, useMemo, useState } from "react";
import type { StoryGroup } from "@/interfaces/story";
import { splitStorySections } from "@/lib/stories/story-sections";

export type StorySections = {
    active: StoryGroup[];
    expired: StoryGroup[];
    ready: boolean; // false until mounted (avoids hydration mismatch)
};

export function useStorySections(groups: StoryGroup[]): StorySections {
    const [now, setNow] = useState<number | null>(null);

    useEffect(() => {
        setNow(Date.now());
    }, []);

    return useMemo<StorySections>(() => {
        if (now === null) {
            const active = [...groups].sort(
                (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
            );
            return { active, expired: [], ready: false };
        }
        const { active, expired } = splitStorySections(groups, now);
        return { active, expired, ready: true };
    }, [groups, now]);
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add "src/app/[locale]/_components/stories/use-story-sections.ts"
git commit -m "feat(stories): useStorySections client hook

Refs: docs/superpowers/plans/2026-06-05-stories-feature.md"
```

---

### Task 8: `useStoryPlayer` hook

**Files:**
- Create: `src/app/[locale]/_components/stories/use-story-player.ts`

Wraps the pure reducer; owns the image auto-advance timer and reduced-motion. Video advancement is driven by the viewer wiring `onEnded`/`onTimeUpdate` to the returned `dispatch`.

- [ ] **Step 1: Create the hook**

```ts
"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import type { StoryGroup } from "@/interfaces/story";
import {
    createInitialState,
    DEFAULT_IMAGE_DURATION_MS,
    reducer,
    type PlayerAction,
    type PlayerState,
} from "@/lib/stories/story-player";

const TICK_MS = 50; // progress update cadence for image items

function usePrefersReducedMotion(): boolean {
    const [reduced, setReduced] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
        const update = () => setReduced(mq.matches);
        update();
        mq.addEventListener("change", update);
        return () => mq.removeEventListener("change", update);
    }, []);
    return reduced;
}

export function useStoryPlayer(groups: StoryGroup[]) {
    const [state, dispatch] = useReducer(
        (s: PlayerState, a: PlayerAction) => reducer(groups, s, a),
        undefined,
        createInitialState,
    );
    const reducedMotion = usePrefersReducedMotion();

    const currentGroup = state.open ? groups[state.groupIndex] : undefined;
    const currentItem = currentGroup?.items[state.itemIndex];

    // Image auto-advance: tick progress over the item's duration. Videos advance
    // via their own `ended` event (wired in the viewer), so no timer here.
    useEffect(() => {
        if (!state.open || state.paused || reducedMotion) return;
        if (!currentItem || currentItem.type !== "image") return;
        const durationMs = currentItem.durationMs ?? DEFAULT_IMAGE_DURATION_MS;
        const interval = window.setInterval(() => {
            dispatch({ type: "TICK", delta: TICK_MS / durationMs });
        }, TICK_MS);
        return () => window.clearInterval(interval);
    }, [state.open, state.paused, state.groupIndex, state.itemIndex, reducedMotion, currentItem]);

    const open = useCallback((groupIndex: number, itemIndex?: number) => {
        dispatch({ type: "OPEN", groupIndex, itemIndex });
    }, []);
    const close = useCallback(() => dispatch({ type: "CLOSE" }), []);
    const next = useCallback(() => dispatch({ type: "NEXT" }), []);
    const prev = useCallback(() => dispatch({ type: "PREV" }), []);
    const pause = useCallback(() => dispatch({ type: "PAUSE" }), []);
    const resume = useCallback(() => dispatch({ type: "RESUME" }), []);
    const setProgress = useCallback((value: number) => dispatch({ type: "SET_PROGRESS", value }), []);

    return {
        state,
        currentGroup,
        currentItem,
        reducedMotion,
        open,
        close,
        next,
        prev,
        pause,
        resume,
        setProgress,
    };
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add "src/app/[locale]/_components/stories/use-story-player.ts"
git commit -m "feat(stories): useStoryPlayer hook (image timer + reduced-motion)

Refs: docs/superpowers/plans/2026-06-05-stories-feature.md"
```

---

### Task 9: `StoryProgress` (presentational)

**Files:**
- Create: `src/app/[locale]/_components/stories/story-progress.tsx`

- [ ] **Step 1: Create the component**

```tsx
import cn from "classnames";

type Props = {
    count: number;
    currentIndex: number;
    progress: number; // 0..1 for the current segment
};

export function StoryProgress({ count, currentIndex, progress }: Props) {
    return (
        <div className="flex gap-1" aria-hidden>
            {Array.from({ length: count }).map((_, index) => {
                let fill = 0;
                if (index < currentIndex) fill = 1;
                else if (index === currentIndex) fill = progress;
                return (
                    <div
                        key={index}
                        className={cn(
                            "h-0.5 flex-1 overflow-hidden rounded-full bg-white/30",
                        )}
                    >
                        <div
                            className="h-full rounded-full bg-white"
                            style={{ width: `${Math.round(fill * 100)}%` }}
                        />
                    </div>
                );
            })}
        </div>
    );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add "src/app/[locale]/_components/stories/story-progress.tsx"
git commit -m "feat(stories): StoryProgress segmented bars

Refs: docs/superpowers/plans/2026-06-05-stories-feature.md"
```

---

### Task 10: `StoryViewer` (full-screen overlay)

**Files:**
- Create: `src/app/[locale]/_components/stories/story-viewer.tsx`

Receives the section's groups + the player API from `useStoryPlayer` (lifted to `StoryBar`). Renders `fixed inset-0 z-50` overlay (matching `site-search-dialog`), progress bars, media stage, caption, tap-zones, controls. Esc closes; arrows navigate; body scroll locked while open.

- [ ] **Step 1: Create the component**

```tsx
"use client";

import cn from "classnames";
import { useEffect, useRef } from "react";
import type { Locale } from "@/i18n/config";
import type { StoryLabels } from "@/i18n/dictionaries";
import type { StoryGroup } from "@/interfaces/story";
import { StoryProgress } from "./story-progress";
import type { useStoryPlayer } from "./use-story-player";

type Player = ReturnType<typeof useStoryPlayer>;

type Props = {
    groups: StoryGroup[];
    locale: Locale;
    labels: StoryLabels;
    player: Player;
};

export function StoryViewer({ groups, locale, labels, player }: Props) {
    const { state, currentGroup, currentItem, close, next, prev, pause, resume, setProgress } = player;
    const videoRef = useRef<HTMLVideoElement>(null);

    // Keyboard: Esc closes, arrows navigate, Space pauses/resumes.
    useEffect(() => {
        if (!state.open) return;
        const onKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") close();
            else if (event.key === "ArrowRight") next();
            else if (event.key === "ArrowLeft") prev();
            else if (event.key === " ") {
                event.preventDefault();
                state.paused ? resume() : pause();
            }
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [state.open, state.paused, close, next, prev, pause, resume]);

    // Lock body scroll while open.
    useEffect(() => {
        if (!state.open) return;
        const previous = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = previous;
        };
    }, [state.open]);

    // Keep the <video> element's play/pause in sync with the paused flag.
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        if (state.paused) video.pause();
        else void video.play().catch(() => {});
    }, [state.paused, state.groupIndex, state.itemIndex]);

    if (!state.open || !currentGroup || !currentItem) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
            role="dialog"
            aria-modal="true"
            aria-label={labels.regionLabel}
        >
            <div className="relative flex h-full w-full max-w-md flex-col">
                {/* Progress + close */}
                <div className="absolute inset-x-0 top-0 z-10 flex flex-col gap-2 p-3">
                    <StoryProgress
                        count={currentGroup.items.length}
                        currentIndex={state.itemIndex}
                        progress={state.progress}
                    />
                    <div className="flex items-center justify-between text-white">
                        <span className="text-sm font-semibold drop-shadow">
                            {currentGroup.title[locale]}
                        </span>
                        <button
                            type="button"
                            onClick={close}
                            aria-label={labels.closeAria}
                            className="text-2xl leading-none text-white/90 hover:text-white"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Media stage */}
                <div className="flex h-full w-full items-center justify-center">
                    {currentItem.type === "image" ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={currentItem.src}
                            alt={currentItem.caption?.[locale] ?? currentGroup.title[locale]}
                            className="max-h-full max-w-full object-contain"
                        />
                    ) : (
                        <video
                            ref={videoRef}
                            key={`${state.groupIndex}-${state.itemIndex}`}
                            src={currentItem.src}
                            poster={currentItem.poster}
                            className="max-h-full max-w-full object-contain"
                            muted
                            playsInline
                            autoPlay
                            preload="metadata"
                            onTimeUpdate={(e) => {
                                const v = e.currentTarget;
                                if (v.duration > 0) setProgress(v.currentTime / v.duration);
                            }}
                            onEnded={next}
                        />
                    )}
                </div>

                {/* Caption */}
                {currentItem.caption && (
                    <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/70 to-transparent p-4 pb-8 text-center text-sm text-white">
                        {currentItem.caption[locale]}
                    </div>
                )}

                {/* Tap zones: left = prev, right = next. Hold to pause. */}
                <button
                    type="button"
                    onClick={prev}
                    onPointerDown={pause}
                    onPointerUp={resume}
                    aria-label={labels.prevAria}
                    className="absolute inset-y-0 left-0 z-0 w-1/3 cursor-default"
                />
                <button
                    type="button"
                    onClick={next}
                    onPointerDown={pause}
                    onPointerUp={resume}
                    aria-label={labels.nextAria}
                    className={cn("absolute inset-y-0 right-0 z-0 w-1/3 cursor-default")}
                />
            </div>
        </div>
    );
}
```

- [ ] **Step 2: Typecheck + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add "src/app/[locale]/_components/stories/story-viewer.tsx"
git commit -m "feat(stories): full-screen StoryViewer overlay

Refs: docs/superpowers/plans/2026-06-05-stories-feature.md"
```

---

### Task 11: `StoryBar` (Active row + Expired archive)

**Files:**
- Create: `src/app/[locale]/_components/stories/story-bar.tsx`

Owns the player and tracks which section ("active"/"expired") the viewer is showing, so the player operates on that section's groups. Renders nothing if there are no rings.

- [ ] **Step 1: Create the component**

```tsx
"use client";

import cn from "classnames";
import { useState } from "react";
import type { Locale } from "@/i18n/config";
import type { StoryLabels } from "@/i18n/dictionaries";
import type { StoryGroup } from "@/interfaces/story";
import { useStorySections } from "./use-story-sections";
import { useStoryPlayer } from "./use-story-player";
import { StoryViewer } from "./story-viewer";

type Props = {
    stories: StoryGroup[];
    locale: Locale;
    labels: StoryLabels;
};

type SectionKey = "active" | "expired";

export function StoryBar({ stories, locale, labels }: Props) {
    const { active, expired } = useStorySections(stories);
    const [section, setSection] = useState<SectionKey>("active");
    const viewerGroups = section === "active" ? active : expired;
    const player = useStoryPlayer(viewerGroups);

    if (active.length === 0 && expired.length === 0) return null;

    const openRing = (key: SectionKey, index: number) => {
        setSection(key);
        // open on next tick so the player is bound to the right section's groups
        requestAnimationFrame(() => player.open(index));
    };

    return (
        <section aria-label={labels.regionLabel} className="mb-8 mt-4">
            {active.length > 0 && (
                <Ring row={active} locale={locale} labels={labels} muted={false} onOpen={(i) => openRing("active", i)} />
            )}
            {expired.length > 0 && (
                <div className="mt-6">
                    <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                        {labels.archiveHeading}
                    </h2>
                    <Ring row={expired} locale={locale} labels={labels} muted onOpen={(i) => openRing("expired", i)} />
                </div>
            )}

            <StoryViewer groups={viewerGroups} locale={locale} labels={labels} player={player} />
        </section>
    );
}

type RingProps = {
    row: StoryGroup[];
    locale: Locale;
    labels: StoryLabels;
    muted: boolean;
    onOpen: (index: number) => void;
};

function Ring({ row, locale, labels, muted, onOpen }: RingProps) {
    return (
        <ul className="flex gap-4 overflow-x-auto pb-1">
            {row.map((group, index) => (
                <li key={group.id} className="shrink-0">
                    <button
                        type="button"
                        onClick={() => onOpen(index)}
                        aria-label={labels.openAria.replace("{title}", group.title[locale])}
                        className="flex w-20 flex-col items-center gap-1 focus:outline-none"
                    >
                        <span
                            className={cn(
                                "rounded-full p-[2px]",
                                muted
                                    ? "bg-neutral-300 dark:bg-neutral-700"
                                    : "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600",
                            )}
                        >
                            <span className="block rounded-full border-2 border-white bg-white dark:border-neutral-900 dark:bg-neutral-900">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={group.cover}
                                    alt=""
                                    className={cn(
                                        "h-16 w-16 rounded-full object-cover",
                                        muted && "opacity-60 grayscale",
                                    )}
                                />
                            </span>
                        </span>
                        <span className="line-clamp-1 w-full text-center text-xs text-neutral-700 dark:text-neutral-300">
                            {group.title[locale]}
                        </span>
                    </button>
                </li>
            ))}
        </ul>
    );
}
```

- [ ] **Step 2: Typecheck + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add "src/app/[locale]/_components/stories/story-bar.tsx"
git commit -m "feat(stories): StoryBar with Active row + Expired archive

Refs: docs/superpowers/plans/2026-06-05-stories-feature.md"
```

---

### Task 12: Wire `StoryBar` into the home page

**Files:**
- Modify: `src/app/[locale]/page.tsx` — add imports + render `<StoryBar>` at the top of `<Container>` (above `<HeroPost>`).

- [ ] **Step 1: Add imports**

After the existing imports in `src/app/[locale]/page.tsx`:

```ts
import { StoryBar } from "@/app/[locale]/_components/stories/story-bar";
import { stories } from "@/data/stories";
```

- [ ] **Step 2: Render the bar**

In the returned JSX, immediately inside `<Container>` and before the JSON-LD scripts' sibling `<HeroPost ... />`, add the bar (it must come after the `dictionary` is computed — it already is, at line 76). Place it just before `<HeroPost`:

```tsx
            <StoryBar stories={stories} locale={locale} labels={dictionary.story} />
            <HeroPost
```

**Note on the `locale` type:** no cast or import change is needed. `notFound()` is typed `never`, so the `if (!isValidLocale(locale)) notFound();` guard at line 72 already narrows `locale` to `Locale` — that is why `getDictionary(locale)` on line 76 compiles. Pass `locale` directly: `locale={locale}`. The only imports to add are the two from Step 1.

- [ ] **Step 3: Typecheck + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add "src/app/[locale]/page.tsx"
git commit -m "feat(stories): render StoryBar on the home page

Refs: docs/superpowers/plans/2026-06-05-stories-feature.md"
```

---

### Task 13: Full verification

**Files:** none (verification only).

- [ ] **Step 1: Unit tests**

Run: `npm test`
Expected: all story-sections + story-player tests PASS, `# fail 0`.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: PASS (no errors).

- [ ] **Step 4: Build — confirm the home page stays STATIC**

Run: `npm run build`
Expected: PASS. In the route table, `/[locale]` (the home page) must be marked **static** (`○` / prerendered), **not** dynamic (`ƒ`). If it flipped to dynamic, stop — a server-side dynamic API leaked in; revisit Task 12.

- [ ] **Step 5: Manual UI check with temporary real media (NOT committed)**

The shipped `stories` array is empty, so the bar renders nothing. To exercise the UI without committing fake content, temporarily point an entry at an asset already in the repo:

```ts
// TEMP — do not commit. Uses an existing real asset.
export const stories: StoryGroup[] = [
    {
        id: "tmp",
        title: { vi: "Thử", en: "Test" },
        cover: "/assets/avatar/my_first_avatar.webp",
        createdAt: new Date().toISOString(),
        items: [
            { id: "t1", type: "image", src: "/assets/avatar/my_first_avatar.webp", createdAt: new Date().toISOString(), caption: { vi: "Xin chào", en: "Hello" } },
            { id: "t2", type: "image", src: "/assets/images/20260520/karaoke.webp", createdAt: new Date().toISOString() },
        ],
    },
];
```

Run: `npm run dev`, open `http://localhost:3000/en`. Verify:
- A circle appears above the hero post; clicking it opens the full-screen viewer.
- Progress bars auto-advance; first image → second image → closes at the end.
- Left/right tap zones go prev/next; holding pauses; `←/→` and `Esc` work.
- Toggle OS "reduce motion": auto-advance stops, tapping still advances.
- An entry with `createdAt` older than 24h appears under the "Archive"/"Lưu trữ" heading with a muted circle.

- [ ] **Step 6: Revert the temporary data**

Restore `src/data/stories.ts` to the empty array (`git checkout src/data/stories.ts`). Confirm `git status` is clean except for intended files.

- [ ] **Step 7: Final confirmation**

Run: `git status` (clean) and re-run `npm test && npx tsc --noEmit && npm run lint`.
Expected: all PASS, working tree clean.

---

## Self-Review

**Spec coverage:**
- Permanent archive, group-level age-based expiry (default 24h, optional override) → Task 3 (`splitStorySections`, `activeForMs`) ✓
- Client-side classification, static-preserving → Task 7 (`useStorySections`, mount baseline) + Task 13 Step 4 (build assertion) ✓
- Mixed image/video, full-fidelity player (progress, auto-advance, tap-zones, hold-pause, cross-ring nav, keyboard/Esc) → Tasks 4, 8, 10 ✓
- IG rings, home entry, Active row + Expired archive → Tasks 11, 12 ✓
- Typed object data source, no markdown → Tasks 2, 5 ✓
- No new dependency → Task 1 (`node:test` + `jiti`) ✓
- i18n captions/labels → Task 6 + locale indexing in viewer/bar ✓
- a11y / reduced-motion / mobile video (`muted playsInline`) → Tasks 8, 10 ✓
- Pure reducer + split unit-tested → Tasks 3, 4 ✓

**Placeholder scan:** No TBD/TODO; every code step shows complete code; commands have expected output.

**Type consistency:** `StoryGroup`/`StoryItem`/`Localized` (Task 2) used identically everywhere; `PlayerState`/`PlayerAction`/`reducer`/`createInitialState`/`DEFAULT_IMAGE_DURATION_MS` (Task 4) consumed unchanged in Task 8; `StoryLabels` (Task 6) consumed in Tasks 10–12; `splitStorySections`/`DEFAULT_ACTIVE_WINDOW_MS` (Task 3) consumed in Task 7 and the data file (Task 5).

**Known follow-ups (out of scope):** optional localStorage "seen" greying (cosmetic) is omitted from tasks to keep scope tight; can be a one-line follow-up on the `Ring` component.
