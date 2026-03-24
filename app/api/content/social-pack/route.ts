import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { openai } from '@/lib/openai/client'
import { buildSocialPackPrompt } from '@/lib/openai/prompts'
import { generateSocialPackSchema } from '@/lib/validations'
import type { ApiResponse, SocialContentPack } from '@/types'

// POST /api/content/social-pack
// Body: { athlete_id, stats: StatRow[], notes? }
// Returns: Instagram caption + TikTok script + Story caption + the exact prompt used
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = generateSocialPackSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { athlete_id, stats, notes } = parsed.data

  // Verify the athlete belongs to the authenticated user
  const { data: athlete, error: athleteErr } = await supabase
    .from('athletes')
    .select('*')
    .eq('id', athlete_id)
    .eq('profile_id', user.id)
    .single()

  if (athleteErr || !athlete) {
    return NextResponse.json({ error: 'Athlete not found' }, { status: 404 })
  }

  const prompt = buildSocialPackPrompt(athlete, stats, notes)

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.8,
  })

  const generated = JSON.parse(completion.choices[0].message.content ?? '{}')

  const pack: SocialContentPack = {
    instagram_caption: {
      body:     generated.instagram_caption?.body     ?? '',
      hashtags: generated.instagram_caption?.hashtags ?? [],
    },
    tiktok_script: {
      hook:     generated.tiktok_script?.hook     ?? '',
      body:     generated.tiktok_script?.body     ?? '',
      cta:      generated.tiktok_script?.cta      ?? '',
      hashtags: generated.tiktok_script?.hashtags ?? [],
    },
    story_caption: {
      body:     generated.story_caption?.body     ?? '',
      hashtags: generated.story_caption?.hashtags ?? [],
    },
    prompt,
    generated_at: new Date().toISOString(),
  }

  return NextResponse.json<ApiResponse<SocialContentPack>>({ data: pack }, { status: 200 })
}
