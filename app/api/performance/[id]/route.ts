import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ApiResponse, PerformanceEntry } from '@/types'

type Params = { params: Promise<{ id: string }> }

// DELETE /api/performance/[id]
export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Fetch entry to get media paths before deletion
  const { data: entry } = await supabase
    .from('performance_entries')
    .select('id, athlete_id, media:performance_media(storage_path)')
    .eq('id', id)
    .single()

  if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Verify ownership
  const { data: athlete } = await supabase
    .from('athletes')
    .select('id')
    .eq('id', entry.athlete_id)
    .eq('profile_id', user.id)
    .single()

  if (!athlete) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Delete storage files
  const paths = (entry.media as Array<{ storage_path: string }>).map((m) => m.storage_path)
  if (paths.length > 0) {
    await supabase.storage.from('performance-media').remove(paths)
  }

  // Delete entry (cascades to performance_media rows)
  const { error } = await supabase
    .from('performance_entries')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}

// PATCH /api/performance/[id] — update notes only (stats are immutable after save)
export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const notes = typeof body.notes === 'string' ? body.notes.slice(0, 2000) : null

  const { data: entry } = await supabase
    .from('performance_entries')
    .select('athlete_id')
    .eq('id', id)
    .single()

  if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: athlete } = await supabase
    .from('athletes')
    .select('id')
    .eq('id', entry.athlete_id)
    .eq('profile_id', user.id)
    .single()

  if (!athlete) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await supabase
    .from('performance_entries')
    .update({ notes })
    .eq('id', id)
    .select('*, media:performance_media(*)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json<ApiResponse<PerformanceEntry>>({ data })
}
