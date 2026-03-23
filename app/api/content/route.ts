import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { openai } from '@/lib/openai/client'
import { buildContentPrompt } from '@/lib/openai/prompts'
import { generateContentSchema } from '@/lib/validations'
import type { ApiResponse, ContentPiece } from '@/types'

// POST /api/content — AI-generate a content piece
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = generateContentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { athlete_id, platform, content_type, tone, context } = parsed.data

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

  const prompt = buildContentPrompt(athlete, platform, content_type, tone, context)

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.8,
  })

  const generated = JSON.parse(completion.choices[0].message.content ?? '{}')

  const { data, error } = await supabase
    .from('content_pieces')
    .insert({
      athlete_id,
      platform,
      content_type,
      tone,
      body: generated.body ?? '',
      hashtags: generated.hashtags ?? [],
      status: 'draft',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json<ApiResponse<ContentPiece>>({ data }, { status: 201 })
}

// GET /api/content?athlete_id=...&platform=...
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const athleteId = searchParams.get('athlete_id')
  const platform = searchParams.get('platform')

  let query = supabase
    .from('content_pieces')
    .select('*')
    .in('athlete_id',
      supabase.from('athletes').select('id').eq('profile_id', user.id)
    )
    .order('created_at', { ascending: false })

  if (athleteId) query = query.eq('athlete_id', athleteId)
  if (platform) query = query.eq('platform', platform)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json<ApiResponse<ContentPiece[]>>({ data })
}
