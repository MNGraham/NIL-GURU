import { createClient } from '@/lib/supabase/server'
import BrandMatchDashboard from '@/components/brands/BrandMatchDashboard'
import type { Athlete, BrandMatch } from '@/types'

export default async function BrandsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: athletes } = await supabase
    .from('athletes')
    .select('*')
    .eq('profile_id', user!.id)

  // Pre-load existing matches for first athlete
  const firstAthlete = athletes?.[0]
  const { data: matches } = firstAthlete
    ? await supabase
        .from('brand_matches')
        .select('*, brand:brands(*)')
        .eq('athlete_id', firstAthlete.id)
        .order('match_score', { ascending: false })
    : { data: [] }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8">Brand Matches</h1>
      <BrandMatchDashboard
        athletes={(athletes ?? []) as Athlete[]}
        initialMatches={(matches ?? []) as BrandMatch[]}
      />
    </div>
  )
}
