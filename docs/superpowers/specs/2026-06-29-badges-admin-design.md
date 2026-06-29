---
ticket: BADGES-001
created: 2026-06-29
status: approved
---

# Badges System + Admin Pages — Design Spec

## Overview

Introduce a badge/achievement system for logged-in users. Badges are grouped into series (e.g., "reading"), each with multiple tiers (e.g., "beginner", "godlike"). Badges are earned automatically when a user meets a numeric threshold (e.g., 5 posts read). Admins can also grant/revoke badges manually.

Alongside the badge system, the admin area is restructured with a shared sidebar layout replacing per-page auth checks.

---

## Scope

### In scope
- DB schema: 4 new tables
- Admin sidebar layout (auth guard + nav)
- Admin: Users page (list users, view/grant/revoke badges)
- Admin: Badges page (CRUD series + definitions)
- `lib/badges/types.ts` — shared TS types
- `lib/actions/badges.ts` — server actions for all badge mutations
- Scroll-to-end tracking table (`user_post_reads`) — schema only; client integration is a follow-on feature

### Out of scope (follow-on)
- Client-side scroll sentinel component
- `markPostRead` server action + badge auto-grant flow
- Toast notification on badge grant
- Badge display on user profile page

---

## Database Schema

### `badge_series`
```sql
create table public.badge_series (
  id     text  primary key,   -- human slug, e.g. "reading"
  label  jsonb not null,      -- {"en": "Reading", "vi": "Đọc sách"}
  icon   text  not null       -- emoji or icon name
);
alter table public.badge_series enable row level security;
create policy "badge_series viewable by everyone"
  on public.badge_series for select using (true);
```

### `badge_definitions`
```sql
create table public.badge_definitions (
  id             uuid primary key default gen_random_uuid(),
  series_id      text not null references public.badge_series(id) on delete cascade,
  tier           text not null,   -- "beginner", "intermediate", "godlike"
  tier_order     int  not null,   -- 1, 2, 3 for display sort
  label          jsonb not null,  -- {"en": "Bookworm", "vi": "Mọt sách"}
  description    jsonb not null,  -- {"en": "Read 5 posts", "vi": "Đọc 5 bài"}
  icon           text not null,
  condition_key  text not null,   -- "posts_read" | "comments_posted"
  threshold      int  not null,
  unique(series_id, tier)
);
alter table public.badge_definitions enable row level security;
create policy "badge_definitions viewable by everyone"
  on public.badge_definitions for select using (true);
```

### `user_badges`
```sql
create table public.user_badges (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  badge_definition_id uuid not null references public.badge_definitions(id) on delete cascade,
  granted_at          timestamptz not null default now(),
  unique(user_id, badge_definition_id)
);
alter table public.user_badges enable row level security;
create policy "users can view own badges"
  on public.user_badges for select using (auth.uid() = user_id);
-- Writes happen only via admin client (service role), no public write policies.
```

### `user_post_reads`
```sql
create table public.user_post_reads (
  user_id   uuid not null references auth.users(id) on delete cascade,
  post_slug text not null,
  read_at   timestamptz not null default now(),
  primary key (user_id, post_slug)
);
alter table public.user_post_reads enable row level security;
create policy "users can view own reads"
  on public.user_post_reads for select using (auth.uid() = user_id);
-- Inserts via server action with auth check; no public insert policy needed.
create index user_post_reads_user_id_idx on public.user_post_reads(user_id);
```

### `types.ts` additions
All four tables added to `Database["public"]["Tables"]` with Row/Insert/Update shapes.

---

## Admin Layout Restructure

### `src/app/[locale]/admin/layout.tsx` (new)
- Server component
- Auth guard: reads `ADMIN_EMAIL` env + current user via `createClient()`. Returns `notFound()` if not admin.
- Renders sidebar with nav links:
  - Stories → `/{locale}/admin/stories`
  - Users → `/{locale}/admin/users`
  - Badges → `/{locale}/admin/badges`
- Active link highlighted based on current pathname
- Children rendered in main content area beside sidebar

### `src/app/[locale]/admin/page.tsx` (new)
- Redirects to `/{locale}/admin/stories` via `redirect()`

### `src/app/[locale]/admin/stories/page.tsx` (modified)
- Remove the per-page auth guard (layout handles it)
- Keep all other logic unchanged

---

## Users Admin Page

### `src/app/[locale]/admin/users/page.tsx`
- Fetches all users: `admin.auth.admin.listUsers()` (paginated, max 1000 for now)
- Fetches all `user_badges` joined with `badge_definitions` and `badge_series`
- Fetches all `profiles` for display names
- Passes combined data to client component

### `src/app/[locale]/admin/users/_components/admin-users.tsx`
- Table rows: avatar initials, email, display_name, joined date, badge count
- Click row → inline expansion showing earned badges (icon + tier + series + grant date)
- Grant badge: select series → select tier (filtered to unearned) → "Grant" button → server action
- Revoke badge: trash icon next to earned badge → confirm dialog → server action

---

## Badges Admin Page

### `src/app/[locale]/admin/badges/page.tsx`
- Fetches all `badge_series` ordered by id
- Fetches all `badge_definitions` ordered by series_id, tier_order
- Fetches count of `user_badges` per definition_id (to block delete if earned)
- Passes all to client component

### `src/app/[locale]/admin/badges/_components/admin-badges.tsx`
- Two-panel layout: series list (left) + definitions for selected series (right)
- Series panel: list items with icon + label + edit/delete. "New Series" button at top.
- Definition panel: table of tiers for selected series. "New Definition" button.
- Delete blocked if any user has earned that badge (show count in tooltip).

### `src/app/[locale]/admin/badges/_components/series-form.tsx`
- Fields: id (slug, text, immutable on edit), icon (emoji input), label.en, label.vi
- Create → `createSeries` action. Edit → `updateSeries` action.

### `src/app/[locale]/admin/badges/_components/definition-form.tsx`
- Fields: tier (text), tier_order (number), icon, label.en, label.vi, description.en, description.vi, condition_key (select: posts_read | comments_posted), threshold (number)
- Create → `createDefinition`. Edit → `updateDefinition`.

---

## Server Actions (`src/lib/actions/badges.ts`)

All actions use `createAdminClient()`. All are admin-only — callers are server components inside the auth-gated admin layout, but actions also re-verify `ADMIN_EMAIL` server-side.

| Action | Input | Behavior |
|---|---|---|
| `createSeries` | BadgeSeries fields | Insert into `badge_series` |
| `updateSeries` | id + updatable fields (label, icon) | Update `badge_series` |
| `deleteSeries` | id | Delete if no definitions reference it (cascade handles definitions, but block if users earned any child badge) |
| `createDefinition` | BadgeDefinition fields | Insert into `badge_definitions` |
| `updateDefinition` | id + fields | Update `badge_definitions` |
| `deleteDefinition` | id | Block if `user_badges` count > 0; else delete |
| `grantBadge` | user_id, badge_definition_id | Upsert into `user_badges` (idempotent) |
| `revokeBadge` | user_id, badge_definition_id | Delete from `user_badges` |

Return type: `{ error?: string }` — consistent with existing action pattern in this repo.

---

## TypeScript Types (`src/lib/badges/types.ts`)

```typescript
export type BadgeSeries = {
  id: string;
  label: { en: string; vi: string };
  icon: string;
};

export type BadgeDefinition = {
  id: string;
  seriesId: string;
  tier: string;
  tierOrder: number;
  label: { en: string; vi: string };
  description: { en: string; vi: string };
  icon: string;
  conditionKey: "posts_read" | "comments_posted";
  threshold: number;
};

export type UserBadge = {
  id: string;
  userId: string;
  badgeDefinitionId: string;
  grantedAt: string;
  definition: BadgeDefinition;
  series: BadgeSeries;
};
```

---

## Error Handling

- Auth failure in layout → `notFound()` (consistent with existing stories page behavior)
- DB errors in server actions → return `{ error: message }` string
- Client components show error banner on non-null error return
- Delete-blocked cases return `{ error: "Cannot delete: N users have earned this badge" }`

---

## What Changes in Existing Files

| File | Change |
|---|---|
| `src/app/[locale]/admin/stories/page.tsx` | Remove auth guard block (lines 22–29); layout owns auth now |
| `src/lib/supabase/types.ts` | Add 4 new table types |
| `supabase/schema.sql` | Append 4 new table definitions |
