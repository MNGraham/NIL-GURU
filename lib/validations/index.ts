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
