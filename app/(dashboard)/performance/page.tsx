import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PerformanceDashboard from '@/components/performance/PerformanceDashboard'
import type { Athlete, PerformanceEntry } from '@/types'

export const metadata = { title: 'Performance — Athlete Revenue Engine' }

export default async function PerformancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch athletes owned by this user
  const { data: athletes } = await supabase
    .from('athletes')
    .select('*')
    .eq('profile_id', user.id)
    .order('created_at', { ascending: false })

  const firstAthlete = athletes?.[0]

  // Pre-load 20 most recent entries for the first athlete
  const { data: entries } = firstAthlete
    ? await supabase
        .from('performance_entries')
        .select('*, media:performance_media(*)')
        .eq('athlete_id', firstAthlete.id)
        .order('recorded_at', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(20)
    : { data: [] }

  return (
    <PerformanceDashboard
      athletes={(athletes ?? []) as Athlete[]}
      initialEntries={(entries ?? []) as PerformanceEntry[]}
    />
  )
}
