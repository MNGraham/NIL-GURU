import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { openai } from '@/lib/openai/client'
import { buildEnhancedNilProfilePrompt } from '@/lib/openai/prompts'
import { generateEnhancedProfileSchema } from '@/lib/validations'
import type { ApiResponse, NilProfile } from '@/types'

// POST /api/profiles/enhanced
// Body: { athlete_id, stats: StatRow[] }
// Generates bio, strengths, brand_appeal_score, audience_persona from performance data
// and upserts them into nil_profiles in Supabase
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = generateEnhancedProfileSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { athlete_id, stats } = parsed.data

  // Verify ownership
  const { data: athlete, error: athleteErr } = await supabase
    .from('athletes')
    .select('*')
    .eq('id', athlete_id)
    .eq('profile_id', user.id)
    .single()

  if (athleteErr || !athlete) {
    return NextResponse.json({ error: 'Athlete not found' }, { status: 404 })
  }

  const prompt = buildEnhancedNilProfilePrompt(athlete, stats, athlete.sport)

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.7,
  })

  const generated = JSON.parse(completion.choices[0].message.content ?? '{}')

  // Upsert into nil_profiles (unique on athlete_id)
  const { data, error } = await supabase
    .from('nil_profiles')
    .upsert({
      athlete_id,
      bio:                generated.bio                ?? null,
      strengths:          generated.strengths           ?? [],
      brand_appeal_score: generated.brand_appeal_score  ?? null,
      audience_persona:   generated.audience_persona    ?? {},
      generated_at:       new Date().toISOString(),
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json<ApiResponse<NilProfile>>({ data }, { status: 201 })
}
