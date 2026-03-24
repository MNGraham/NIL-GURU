import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createRecommendationEngine } from '@/lib/brands/engine'
import { brandRecommendSchema } from '@/lib/validations'
import type { ApiResponse, BrandRecommendationResult } from '@/types'

// POST /api/brands/recommend
// Body: { sport, location, performance_type }
// Returns 3–5 brand categories with explanations and outreach messages.
// Currently rule-based — swap engine in lib/brands/engine.ts for AI.
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = brandRecommendSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const engine = createRecommendationEngine()
  const result = engine.recommend(parsed.data)

  return NextResponse.json<ApiResponse<BrandRecommendationResult>>({ data: result })
}
