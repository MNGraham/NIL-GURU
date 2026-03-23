import { createClient } from '@/lib/supabase/server'
import NilProfileCard from '@/components/athletes/NilProfileCard'
import type { Athlete, NilProfile } from '@/types'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: athletes } = await supabase
    .from('athletes')
    .select('*, nil_profiles(*)')
    .eq('profile_id', user!.id)

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8">NIL Media Profiles</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {(athletes ?? []).map((a: Athlete & { nil_profiles: NilProfile | null }) => (
          <NilProfileCard key={a.id} athlete={a} nilProfile={a.nil_profiles} />
        ))}
      </div>
    </div>
  )
}
