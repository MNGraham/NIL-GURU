-- ============================================================
-- NIL Profile Enhancements
-- Add strengths, brand appeal score, and audience persona
-- ============================================================

alter table public.nil_profiles
  add column if not exists strengths          text[] default '{}',
  add column if not exists brand_appeal_score numeric(5,2),
  add column if not exists audience_persona   jsonb  default '{}';

comment on column public.nil_profiles.strengths          is 'AI-identified athlete strengths (e.g. "clutch performer", "high motor")';
comment on column public.nil_profiles.brand_appeal_score is 'AI-scored brand marketability 0–100';
comment on column public.nil_profiles.audience_persona   is '{"archetype","age_range","interests","platforms","description"}';
