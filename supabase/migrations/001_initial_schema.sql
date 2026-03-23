-- ============================================================
-- Athlete Revenue Engine — Initial Schema
-- ============================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text,
  avatar_url  text,
  role        text not null default 'athlete' check (role in ('athlete', 'agent', 'admin')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- ATHLETES
-- ============================================================
create table public.athletes (
  id            uuid primary key default uuid_generate_v4(),
  profile_id    uuid not null references public.profiles(id) on delete cascade,
  sport         text not null,
  position      text,
  school        text,
  graduation_year int,
  -- Stats stored as flexible JSONB (sport-agnostic)
  stats         jsonb not null default '{}',
  -- Social handles
  instagram     text,
  twitter       text,
  tiktok        text,
  -- NIL profile visibility
  is_public     boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ============================================================
-- NIL MEDIA PROFILES
-- Aggregated public-facing profile for brand discovery
-- ============================================================
create table public.nil_profiles (
  id              uuid primary key default uuid_generate_v4(),
  athlete_id      uuid not null references public.athletes(id) on delete cascade,
  headline        text,               -- AI-generated one-liner
  bio             text,               -- AI-generated full bio
  follower_count  int default 0,
  engagement_rate numeric(5,2),       -- percentage
  audience_demo   jsonb default '{}', -- {age_range, gender_split, top_locations}
  asking_rate     numeric(10,2),      -- USD per post
  categories      text[] default '{}',-- ["fitness","lifestyle","gaming"]
  generated_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique(athlete_id)
);

-- ============================================================
-- SOCIAL CONTENT
-- AI-generated posts for multiple platforms
-- ============================================================
create table public.content_pieces (
  id           uuid primary key default uuid_generate_v4(),
  athlete_id   uuid not null references public.athletes(id) on delete cascade,
  platform     text not null check (platform in ('instagram', 'twitter', 'tiktok', 'linkedin')),
  content_type text not null check (content_type in ('post', 'caption', 'story', 'bio')),
  body         text not null,
  hashtags     text[] default '{}',
  tone         text check (tone in ('hype', 'professional', 'casual', 'motivational')),
  status       text not null default 'draft' check (status in ('draft', 'approved', 'published')),
  published_at timestamptz,
  created_at   timestamptz not null default now()
);

-- ============================================================
-- BRANDS
-- Brand catalog for NIL match suggestions
-- ============================================================
create table public.brands (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  logo_url      text,
  website       text,
  industry      text not null,         -- "sports_apparel","nutrition","gaming",...
  categories    text[] default '{}',
  deal_min_usd  numeric(10,2),
  deal_max_usd  numeric(10,2),
  target_sports text[] default '{}',
  description   text,
  contact_email text,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

-- ============================================================
-- BRAND MATCHES
-- AI-scored pairings between athletes and brands
-- ============================================================
create table public.brand_matches (
  id           uuid primary key default uuid_generate_v4(),
  athlete_id   uuid not null references public.athletes(id) on delete cascade,
  brand_id     uuid not null references public.brands(id) on delete cascade,
  match_score  numeric(5,2) not null,   -- 0–100
  reasons      text[] default '{}',     -- why this match was made
  status       text not null default 'suggested' check (status in ('suggested', 'interested', 'contacted', 'declined', 'deal')),
  generated_at timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique(athlete_id, brand_id)
);

-- ============================================================
-- ROW-LEVEL SECURITY
-- ============================================================

alter table public.profiles        enable row level security;
alter table public.athletes        enable row level security;
alter table public.nil_profiles    enable row level security;
alter table public.content_pieces  enable row level security;
alter table public.brands          enable row level security;
alter table public.brand_matches   enable row level security;

-- Profiles: users see/edit their own
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- Athletes: owner full access; public profiles readable by all
create policy "athletes_owner_all"   on public.athletes for all   using (profile_id = auth.uid());
create policy "athletes_public_read" on public.athletes for select using (is_public = true);

-- NIL Profiles: public read for public athletes
create policy "nil_profiles_owner"        on public.nil_profiles for all    using (
  athlete_id in (select id from public.athletes where profile_id = auth.uid())
);
create policy "nil_profiles_public_read"  on public.nil_profiles for select using (
  athlete_id in (select id from public.athletes where is_public = true)
);

-- Content: owner only
create policy "content_owner_all" on public.content_pieces for all using (
  athlete_id in (select id from public.athletes where profile_id = auth.uid())
);

-- Brands: read-only for all authenticated users
create policy "brands_read_all" on public.brands for select using (auth.role() = 'authenticated');

-- Brand matches: owner sees their matches
create policy "matches_owner_all" on public.brand_matches for all using (
  athlete_id in (select id from public.athletes where profile_id = auth.uid())
);

-- ============================================================
-- HELPERS / TRIGGERS
-- ============================================================

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at       before update on public.profiles       for each row execute procedure public.set_updated_at();
create trigger trg_athletes_updated_at       before update on public.athletes       for each row execute procedure public.set_updated_at();
create trigger trg_nil_profiles_updated_at   before update on public.nil_profiles   for each row execute procedure public.set_updated_at();
create trigger trg_brand_matches_updated_at  before update on public.brand_matches  for each row execute procedure public.set_updated_at();

-- Auto-create profile row on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
