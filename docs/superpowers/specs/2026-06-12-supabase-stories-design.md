# Supabase-backed stories — design

Date: 2026-06-12
Status: approved (brainstormed in session)

## Goal

Stories are currently hardcoded in `src/data/stories.ts` with media committed to
`public/assets/stories/`; publishing requires a code change and redeploy. Move
stories to Supabase (DB + Storage) with an owner-only admin page so new stories
can be uploaded anytime, server-rendered from the database.

## Decisions (from brainstorm)

- **Full migrate**: one-off script uploads existing media to Supabase Storage and
  inserts rows; `src/data/stories.ts` and old media are deleted after the
  migration is verified live.
- **Music stays in `public/music/`**: the form's song picker lists the existing
  `MUSIC_TRACKS`; stories keep storing `/music/*.mp3` path strings.
- **Cached SSR**: homepage fetches stories from Supabase server-side via
  `unstable_cache` tagged `"stories"`; admin mutations call
  `revalidateTag("stories")` so new stories appear instantly without redeploy.
- **Owner = email match**: server actions and the admin page compare the session
  email to the `ADMIN_EMAIL` env var (already used for comment admin). DB has no write policies — writes go only
  through the service-role client after that check.
- **Form scope v1**: image items (client-side webp compression) AND video items
  (mp4 + poster), edit + delete of existing groups, optional address/post link
  fields per item, music picker with audio preview of the chosen `startTime`.

## Architecture

### Database (`supabase/schema.sql` addition)

```sql
create table public.story_groups (
  id            text        primary key,          -- slug, e.g. "lau-chay"
  title         jsonb       not null,             -- {vi, en}
  cover         text        not null,             -- storage public URL
  items         jsonb       not null,             -- StoryItem[] (same shape as the TS type)
  created_at    timestamptz not null default now(),
  active_for_ms bigint                            -- optional expiry override
);
```

RLS enabled; `select` for everyone, no write policies (service-role only).
`items` is jsonb, not a normalized table: single author, groups are always
read/written whole, and zod validates on write.

### Storage

Bucket `stories`, public read. Object paths `<groupId>/<fileName>`. Uploads go
browser → bucket via a **signed upload URL** issued by an owner-checked server
action (avoids the server-action body limit; matters for video). Images are
compressed to webp client-side (canvas) before upload.

### Read path

`src/lib/stories/fetch-stories.ts`: select rows → map row → `StoryGroup` →
zod-validate, wrapped in `unstable_cache(..., { tags: ["stories"] })`.
`src/app/[locale]/page.tsx` awaits it and passes the result to `StoryBar`.
Viewer components are untouched (same `StoryGroup` shape); expiry stays
client-side as today.

### Admin page `/[locale]/admin/stories`

Server component gate: no session or email ≠ `ADMIN_EMAIL` → `notFound()`.
Lists existing groups with edit/delete; create/edit form (client component):

- Group: title vi/en, createdAt (default now), cover defaults to first image
  item, override allowed.
- Items: add/remove/reorder; image (file → webp → upload) or video (mp4 +
  poster); per item captions vi/en, optional address (name vi/en + link),
  optional post (title vi/en + link).
- Music picker: dropdown over `MUSIC_TRACKS`; `<audio>` preview with a
  slider/seconds input for `startTime`, play seeks to that point — mirrors the
  story viewer behaviour.

Server actions in `src/lib/actions/stories.ts`: `createStory`, `updateStory`,
`deleteStory` (also removes bucket objects), `createUploadUrl`. Each: owner
check → zod validate → service-role write → `revalidateTag("stories")`.

### Migration

`scripts/migrate-stories.ts` (jiti): reads the current `stories` array, uploads
referenced files from `public/` to the bucket, rewrites `src`/`cover`/`poster`
to storage URLs (music paths untouched), upserts rows via service key.

### Tests

Zod schema + row→`StoryGroup` mapping tests under `src/lib/stories/` (node:test
via jiti, bracket-free path, `@/` only as `import type` — existing constraints).

## Env

- `ADMIN_EMAIL` — reused (already present); admin gate + server-action owner check.
- `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SECRET_KEY` — already present.
