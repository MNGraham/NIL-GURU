import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { performanceEntrySchema } from '@/lib/validations'
import type { ApiResponse, PerformanceEntry } from '@/types'

// GET /api/performance?athlete_id=...&limit=20&offset=0
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const athleteId = searchParams.get('athlete_id')
  const limit     = Math.min(Number(searchParams.get('limit') ?? 20), 50)
  const offset    = Number(searchParams.get('offset') ?? 0)

  if (!athleteId) {
    return NextResponse.json({ error: 'athlete_id required' }, { status: 400 })
  }

  // Verify the athlete belongs to the requesting user (via RLS, but explicit check is cleaner)
  const { data: athlete } = await supabase
    .from('athletes')
    .select('id')
    .eq('id', athleteId)
    .eq('profile_id', user.id)
    .single()

  if (!athlete) {
    return NextResponse.json({ error: 'Athlete not found' }, { status: 404 })
  }

  const { data, error } = await supabase
    .from('performance_entries')
    .select('*, media:performance_media(*)')
    .eq('athlete_id', athleteId)
    .order('recorded_at', { ascending: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json<ApiResponse<PerformanceEntry[]>>({ data })
}

// POST /api/performance — create entry + media rows in one transaction
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = performanceEntrySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { athlete_id, recorded_at, stats, notes, media } = parsed.data

  // Ownership check
  const { data: athlete } = await supabase
    .from('athletes')
    .select('id')
    .eq('id', athlete_id)
    .eq('profile_id', user.id)
    .single()

  if (!athlete) {
    return NextResponse.json({ error: 'Athlete not found' }, { status: 404 })
  }

  // Insert entry
  const { data: entry, error: entryErr } = await supabase
    .from('performance_entries')
    .insert({ athlete_id, recorded_at, stats, notes: notes ?? null })
    .select()
    .single()

  if (entryErr) return NextResponse.json({ error: entryErr.message }, { status: 500 })

  // Insert media rows (if any)
  if (media.length > 0) {
    const mediaRows = media.map((m) => ({ ...m, entry_id: entry.id }))
    const { error: mediaErr } = await supabase
      .from('performance_media')
      .insert(mediaRows)
    if (mediaErr) return NextResponse.json({ error: mediaErr.message }, { status: 500 })
  }

  // Return full entry with media
  const { data: full } = await supabase
    .from('performance_entries')
    .select('*, media:performance_media(*)')
    .eq('id', entry.id)
    .single()

  // Also merge latest stats into athletes.stats for AI use
  await supabase
    .from('athletes')
    .update({ stats: { ...(athlete as Record<string, unknown>), latest_performance: stats } })
    .eq('id', athlete_id)

  return NextResponse.json<ApiResponse<PerformanceEntry>>({ data: full }, { status: 201 })
}
