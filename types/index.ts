export type UserRole = 'athlete' | 'agent' | 'admin'
export type Platform = 'instagram' | 'twitter' | 'tiktok' | 'linkedin'
export type ContentType = 'post' | 'caption' | 'story' | 'bio'
export type ContentTone = 'hype' | 'professional' | 'casual' | 'motivational'
export type ContentStatus = 'draft' | 'approved' | 'published'
export type MatchStatus = 'suggested' | 'interested' | 'contacted' | 'declined' | 'deal'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Athlete {
  id: string
  profile_id: string
  sport: string
  position: string | null
  school: string | null
  graduation_year: number | null
  stats: Record<string, unknown>
  instagram: string | null
  twitter: string | null
  tiktok: string | null
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface AudiencePersona {
  archetype: string          // e.g. "Weekend Warrior", "Campus Influencer"
  age_range: string          // e.g. "18–24"
  interests: string[]        // e.g. ["fitness", "sneakers", "gaming"]
  platforms: string[]        // e.g. ["instagram", "tiktok"]
  description: string        // 1–2 sentence summary of ideal follower
}

export interface NilProfile {
  id: string
  athlete_id: string
  headline: string | null
  bio: string | null
  follower_count: number
  engagement_rate: number | null
  audience_demo: {
    age_range?: string
    gender_split?: Record<string, number>
    top_locations?: string[]
  }
  asking_rate: number | null
  categories: string[]
  strengths: string[]
  brand_appeal_score: number | null
  audience_persona: AudiencePersona | null
  generated_at: string | null
  created_at: string
  updated_at: string
}

export interface ContentPiece {
  id: string
  athlete_id: string
  platform: Platform
  content_type: ContentType
  body: string
  hashtags: string[]
  tone: ContentTone | null
  status: ContentStatus
  published_at: string | null
  created_at: string
}

export interface Brand {
  id: string
  name: string
  logo_url: string | null
  website: string | null
  industry: string
  categories: string[]
  deal_min_usd: number | null
  deal_max_usd: number | null
  target_sports: string[]
  description: string | null
  contact_email: string | null
  is_active: boolean
  created_at: string
}

export interface BrandMatch {
  id: string
  athlete_id: string
  brand_id: string
  match_score: number
  reasons: string[]
  status: MatchStatus
  generated_at: string
  updated_at: string
  brand?: Brand
}

// ---- Performance ----

export interface StatRow {
  label: string   // e.g. "40-Yard Dash"
  value: string   // e.g. "4.38"
  unit: string    // e.g. "sec"
}

export interface PerformanceMedia {
  id: string
  entry_id: string
  storage_path: string
  file_name: string
  mime_type: string
  size_bytes: number | null
  created_at: string
}

export interface PerformanceEntry {
  id: string
  athlete_id: string
  recorded_at: string       // ISO date string "YYYY-MM-DD"
  stats: StatRow[]
  notes: string | null
  created_at: string
  updated_at: string
  media?: PerformanceMedia[]
}

export interface SocialContentPack {
  instagram_caption: { body: string; hashtags: string[] }
  tiktok_script:     { hook: string; body: string; cta: string; hashtags: string[] }
  story_caption:     { body: string; hashtags: string[] }
  prompt:            string
  generated_at:      string
}

// API request/response shapes
export interface GenerateContentRequest {
  athlete_id: string
  platform: Platform
  content_type: ContentType
  tone: ContentTone
  context?: string
}

export interface GenerateProfileRequest {
  athlete_id: string
}

export interface GenerateBrandMatchesRequest {
  athlete_id: string
  limit?: number
}

export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
}
