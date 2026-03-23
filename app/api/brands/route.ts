import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ApiResponse, Brand } from '@/types'

// GET /api/brands?sport=football&industry=apparel
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const sport = searchParams.get('sport')
  const industry = searchParams.get('industry')

  let query = supabase
    .from('brands')
    .select('*')
    .eq('is_active', true)
    .order('name')

  if (industry) query = query.eq('industry', industry)
  if (sport) query = query.contains('target_sports', [sport])

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json<ApiResponse<Brand[]>>({ data })
}
