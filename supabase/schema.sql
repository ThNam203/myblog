-- Run this in the Supabase SQL editor

-- Profiles: one per auth user, stores display name
create table public.profiles (
  id            uuid        primary key references auth.users(id) on delete cascade,
  display_name  text        not null,
  created_at    timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- Auto-create profile on signup, pulling display_name from user_metadata
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- Comments: 2-level threading (parent_id = null → top-level, parent_id = top-level id → reply)
create table public.comments (
  id          uuid        primary key default gen_random_uuid(),
  post_slug   text        not null,
  user_id     uuid        not null references auth.users(id) on delete cascade,
  parent_id   uuid        references public.comments(id) on delete cascade,
  body        text        not null check (char_length(body) between 1 and 2000),
  created_at  timestamptz not null default now()
);

alter table public.comments enable row level security;

create policy "comments are viewable by everyone"
  on public.comments for select using (true);

create policy "authenticated users can insert comments"
  on public.comments for insert with check (auth.uid() = user_id);

-- Users can delete only their own comments (admin deletion is handled server-side with the secret key)
create policy "users can delete own comments"
  on public.comments for delete using (auth.uid() = user_id);

-- Index for fast per-post queries
create index comments_post_slug_idx on public.comments(post_slug);
create index comments_parent_id_idx on public.comments(parent_id);

-- Anonymous confessions: no user_id, email, locale, or other identity fields
create table public.confessions (
  id         uuid        primary key default gen_random_uuid(),
  body       text        not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

alter table public.confessions enable row level security;

create policy "confessions are viewable by everyone"
  on public.confessions for select using (true);

-- Inserts are performed only with the secret key in server actions (no public insert policy)

create index confessions_created_at_idx on public.confessions(created_at desc);

-- Anonymous post reactions: session_id is a client-generated UUID stored in localStorage
create table public.post_reactions (
  id          uuid        primary key default gen_random_uuid(),
  post_slug   text        not null,
  emoji       text        not null check (emoji in ('heart', 'fire', 'cry', 'laugh')),
  session_id  text        not null,
  created_at  timestamptz not null default now(),
  constraint post_reactions_unique unique (post_slug, emoji, session_id)
);

alter table public.post_reactions enable row level security;

create policy "reactions are viewable by everyone"
  on public.post_reactions for select using (true);

-- Inserts/deletes are performed only with the secret key in server actions

create index post_reactions_post_slug_idx on public.post_reactions(post_slug);

-- Per-post view counts: one counter row per slug, bumped atomically via RPC.
-- Per-session dedup happens client-side (sessionStorage), so this stays a lean
-- counter rather than one row per view.
create table public.post_views (
  post_slug  text        primary key,
  count      bigint      not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.post_views enable row level security;

create policy "post views are viewable by everyone"
  on public.post_views for select using (true);

-- Counts are bumped only through increment_post_views() (security definer);
-- there is no public insert/update policy.
create or replace function public.increment_post_views(slug text)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.post_views (post_slug, count, updated_at)
  values (slug, 1, now())
  on conflict (post_slug)
  do update set count = public.post_views.count + 1, updated_at = now();
$$;

-- Story groups: owner-authored stories (one row per group, items as jsonb in
-- the same shape as the StoryGroup TS type). Writes happen only through
-- owner-checked server actions using the secret key, so there are no write
-- policies here.
create table public.story_groups (
  id            text        primary key,
  title         jsonb       not null,
  cover         text        not null,
  items         jsonb       not null,
  created_at    timestamptz not null default now(),
  active_for_ms bigint
);

alter table public.story_groups enable row level security;

create policy "story groups are viewable by everyone"
  on public.story_groups for select using (true);

-- Storage bucket for story media (public read; uploads via signed upload URLs
-- created server-side with the secret key, which bypasses storage RLS).
insert into storage.buckets (id, name, public)
values ('stories', 'stories', true)
on conflict (id) do nothing;
