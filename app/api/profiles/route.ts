import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { openai } from '@/lib/openai/client'
import { buildNilProfilePrompt } from '@/lib/openai/prompts'
import { generateProfileSchema } from '@/lib/validations'
import type { ApiResponse, NilProfile } from '@/types'

// POST /api/profiles — generate or regenerate NIL media profile
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = generateProfileSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { athlete_id } = parsed.data

  const { data: athlete, error: athleteErr } = await supabase
    .from('athletes')
    .select('*')
    .eq('id', athlete_id)
    .eq('profile_id', user.id)
    .single()

  if (athleteErr || !athlete) {
    return NextResponse.json({ error: 'Athlete not found' }, { status: 404 })
  }

  const prompt = buildNilProfilePrompt(athlete)

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.7,
  })

  const generated = JSON.parse(completion.choices[0].message.content ?? '{}')

  const { data, error } = await supabase
    .from('nil_profiles')
    .upsert({
      athlete_id,
      headline: generated.headline ?? null,
      bio: generated.bio ?? null,
      categories: generated.categories ?? [],
      generated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json<ApiResponse<NilProfile>>({ data }, { status: 201 })
}
