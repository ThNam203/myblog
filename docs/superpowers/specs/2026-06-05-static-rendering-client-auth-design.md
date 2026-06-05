# Static rendering + client-side auth

Date: 2026-06-05
Branch: `perf/static-rendering-client-auth`

## Problem

The blog's content is filesystem markdown (`gray-matter` + `fs.readFileSync`) and
every content route declares `generateStaticParams` — the architecture intends SSG.
But two `cookies()` reads in server layouts opt the entire tree into per-request
dynamic rendering:

1. `src/app/layout.tsx` (root) — `await cookies()` to read theme/locale for
   `<html lang>` and the RSS `<link>`. Root layout wraps every route, so this forces
   the **whole app** dynamic.
2. `src/app/[locale]/layout.tsx` — `createClient()` → `supabase.auth.getUser()`
   (reads cookies in `src/lib/supabase/server.ts`). Forces everything under
   `[locale]` dynamic and adds a blocking Supabase Auth network round-trip on every
   page load, even anonymous public pages.

Result: zero static HTML, no CDN HTML caching, markdown re-parsed every request,
auth validated against Supabase on every page view.

## Goal

All content pages render to static HTML at build time (CDN-cacheable). No
per-request Supabase call or disk re-parse on the hot path. Auth becomes a
browser-side concern. No security regression.

## Design

### 1. Root `app/layout.tsx` — remove dynamic API
- Drop `await cookies()` and the `cookies`/`isValidLocale`/`defaultLocale` imports it
  needed solely for locale.
- Render `<html lang={defaultLocale}>` (static `"vi"`).
- Remove the RSS `<link rel="alternate">` here (relocated to step 2).
- Keep `noFoucScript` unchanged (already client-side `localStorage`).

### 2. `[locale]/layout.tsx` — remove dynamic API, relocate RSS
- Remove `createClient()` + `supabase.auth.getUser()` and the avatar derivation.
- Stop passing `isAuthenticated` / `avatarUrl` to `HeaderSiteMenu`.
- Emit the RSS alternate via the Metadata API inside the existing
  `generateMetadata` (it has the `locale` param):
  `alternates: { types: { "application/rss+xml": "/${locale}/rss.xml" } }`.
  This is generated statically per locale and replaces the root `<link>`.
- Add a small client component `<HtmlLangSync locale={locale} />` that sets
  `document.documentElement.lang = locale` on mount. SSR HTML starts `lang="vi"`;
  `/en` pages correct on hydration. Keeps a11y/SEO reasonable without forcing
  dynamic rendering.

### 3. `HeaderSiteMenu` — self-fetch auth
- Make `isAuthenticated` / `avatarUrl` props optional (or remove).
- On mount: browser `createClient()` → `getUser()`, derive avatar from
  `user_metadata.avatar_url || user_metadata.picture`. Subscribe to
  `onAuthStateChange` for live updates; unsubscribe on cleanup.
- Initial render is signed-out, resolves a beat after paint. Same pattern already
  used by `src/app/_components/comments/comment-section.tsx`.

### 4. Data layer — `cache()` dedup
- Wrap `getAllPosts` and `getPostBySlug` in React `cache()` in `src/lib/api.ts` to
  dedup repeated reads within a single render pass. Cheap, behavior-preserving,
  helps build time and any residual dynamic path.

## Out of scope / unchanged
- `src/middleware.ts` — already redirects to a locale prefix and refreshes the auth
  token on `/profile` and `/auth`. Unchanged and still correct.
- Security: `getUser()` token validation remains where it gates access — middleware
  refresh, `profile` page, and server actions. Only the **public layout** call is
  removed. No security regression.

## Tradeoffs (accepted by user)
- Header signed-in state flickers in after hydration (full client-side auth chosen).
- Root `<html lang>` SSR default is `vi`, corrected client-side per route.

## Verification
- `pnpm build` (or `npm run build`) → home / posts / categories show `○` (static) or
  `●` (SSG) in the route table, not `ƒ` (dynamic).
- `npx tsc --noEmit` clean.
- Manual: signed-in header still resolves; `/en` and `/vi` RSS links present in head;
  protected `/profile` still gated.
