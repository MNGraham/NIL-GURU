-- ============================================================
-- Performance Entries + Media
-- ============================================================

create table public.performance_entries (
  id          uuid primary key default uuid_generate_v4(),
  athlete_id  uuid not null references public.athletes(id) on delete cascade,
  recorded_at date not null default current_date,
  -- Flexible array of stat objects: [{ label, value, unit }]
  stats       jsonb not null default '[]',
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.performance_media (
  id           uuid primary key default uuid_generate_v4(),
  entry_id     uuid not null references public.performance_entries(id) on delete cascade,
  storage_path text not null,   -- path inside the 'performance-media' bucket
  file_name    text not null,
  mime_type    text not null,
  size_bytes   int,
  created_at   timestamptz not null default now()
);

-- Indexes
create index on public.performance_entries (athlete_id, recorded_at desc);
create index on public.performance_media   (entry_id);

-- updated_at trigger
create trigger trg_perf_entries_updated_at
  before update on public.performance_entries
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- Row-Level Security
-- ============================================================

alter table public.performance_entries enable row level security;
alter table public.performance_media   enable row level security;

-- Entries: owner can do everything
create policy "perf_entries_owner_all" on public.performance_entries
  for all using (
    athlete_id in (
      select id from public.athletes where profile_id = auth.uid()
    )
  );

-- Media: owner can do everything (joins through entries → athletes)
create policy "perf_media_owner_all" on public.performance_media
  for all using (
    entry_id in (
      select pe.id
      from public.performance_entries pe
      join public.athletes a on a.id = pe.athlete_id
      where a.profile_id = auth.uid()
    )
  );

-- ============================================================
-- Storage bucket (run in Supabase dashboard or via CLI)
-- The bucket 'performance-media' must be created separately.
-- Storage RLS policies below assume the bucket exists.
-- ============================================================

-- Bucket policy: authenticated users can upload to their own folder
-- INSERT: path must start with {user_id}/
-- SELECT: owner can read their files
-- These are created via the Supabase Storage API, not SQL migrations.
-- See: https://supabase.com/docs/guides/storage/security/access-control
