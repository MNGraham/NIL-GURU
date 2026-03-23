import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { openai } from '@/lib/openai/client'
import { buildBrandMatchPrompt } from '@/lib/openai/prompts'
import { generateBrandMatchesSchema } from '@/lib/validations'
import type { ApiResponse, BrandMatch } from '@/types'

// POST /api/brands/matches — AI-generate brand match suggestions
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = generateBrandMatchesSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { athlete_id, limit } = parsed.data

  const { data: athlete, error: athleteErr } = await supabase
    .from('athletes')
    .select('*')
    .eq('id', athlete_id)
    .eq('profile_id', user.id)
    .single()

  if (athleteErr || !athlete) {
    return NextResponse.json({ error: 'Athlete not found' }, { status: 404 })
  }

  // Fetch active brands relevant to athlete's sport
  const { data: brands } = await supabase
    .from('brands')
    .select('id, name, industry, categories, target_sports, description')
    .eq('is_active', true)
    .or(`target_sports.cs.{${athlete.sport}},target_sports.eq.{}`)
    .limit(50)

  if (!brands?.length) {
    return NextResponse.json({ data: [] })
  }

  const prompt = buildBrandMatchPrompt(athlete, brands)

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.5,
  })

  const raw = JSON.parse(completion.choices[0].message.content ?? '{"matches":[]}')
  const matches: Array<{ brand_id: string; score: number; reasons: string[] }> =
    raw.matches ?? raw

  const topMatches = matches.slice(0, limit)

  // Upsert matches into DB
  const rows = topMatches.map((m) => ({
    athlete_id,
    brand_id: m.brand_id,
    match_score: m.score,
    reasons: m.reasons,
    status: 'suggested' as const,
    generated_at: new Date().toISOString(),
  }))

  const { data, error } = await supabase
    .from('brand_matches')
    .upsert(rows, { onConflict: 'athlete_id,brand_id' })
    .select('*, brand:brands(*)')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json<ApiResponse<BrandMatch[]>>({ data }, { status: 201 })
}

// GET /api/brands/matches?athlete_id=...
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const athleteId = searchParams.get('athlete_id')
  if (!athleteId) {
    return NextResponse.json({ error: 'athlete_id required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('brand_matches')
    .select('*, brand:brands(*)')
    .eq('athlete_id', athleteId)
    .order('match_score', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json<ApiResponse<BrandMatch[]>>({ data })
}
