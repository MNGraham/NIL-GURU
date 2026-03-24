import { z } from 'zod'

export const athleteSchema = z.object({
  sport: z.string().min(1),
  position: z.string().optional(),
  school: z.string().optional(),
  graduation_year: z.number().int().min(2020).max(2035).optional(),
  stats: z.record(z.unknown()).default({}),
  instagram: z.string().optional(),
  twitter: z.string().optional(),
  tiktok: z.string().optional(),
  is_public: z.boolean().default(false),
})

export const generateContentSchema = z.object({
  athlete_id: z.string().uuid(),
  platform: z.enum(['instagram', 'twitter', 'tiktok', 'linkedin']),
  content_type: z.enum(['post', 'caption', 'story', 'bio']),
  tone: z.enum(['hype', 'professional', 'casual', 'motivational']),
  context: z.string().max(500).optional(),
})

export const generateProfileSchema = z.object({
  athlete_id: z.string().uuid(),
})

export const generateBrandMatchesSchema = z.object({
  athlete_id: z.string().uuid(),
  limit: z.number().int().min(1).max(20).default(10),
})

export const updateMatchStatusSchema = z.object({
  status: z.enum(['suggested', 'interested', 'contacted', 'declined', 'deal']),
})

const statRowSchema = z.object({
  label: z.string().min(1).max(80),
  value: z.string().min(1).max(40),
  unit:  z.string().max(20).default(''),
})

export const generateEnhancedProfileSchema = z.object({
  athlete_id: z.string().uuid(),
  stats:      z.array(z.object({
    label: z.string().min(1).max(80),
    value: z.string().min(1).max(40),
    unit:  z.string().max(20).default(''),
  })).max(30).default([]),
})

export const generateSocialPackSchema = z.object({
  athlete_id:  z.string().uuid(),
  stats:       z.array(z.object({
    label: z.string().min(1).max(80),
    value: z.string().min(1).max(40),
    unit:  z.string().max(20).default(''),
  })).max(30).default([]),
  notes:       z.string().max(2000).optional(),
})

export const performanceEntrySchema = z.object({
  athlete_id:  z.string().uuid(),
  recorded_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  stats:       z.array(statRowSchema).max(30).default([]),
  notes:       z.string().max(2000).optional(),
  // paths already uploaded to Supabase Storage by the client
  media: z.array(z.object({
    storage_path: z.string().min(1),
    file_name:    z.string().min(1),
    mime_type:    z.string().min(1),
    size_bytes:   z.number().int().nonnegative().optional(),
  })).max(10).default([]),
})
