import { createClient } from '@/lib/supabase/server'
import AthleteCard from '@/components/athletes/AthleteCard'
import NewAthleteButton from '@/components/athletes/NewAthleteButton'
import type { Athlete } from '@/types'

export default async function AthletesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: athletes } = await supabase
    .from('athletes')
    .select('*')
    .eq('profile_id', user!.id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Athletes</h1>
        <NewAthleteButton />
      </div>
      {!athletes?.length ? (
        <div className="text-center text-gray-500 mt-20">
          <p className="text-lg">No athletes yet.</p>
          <p className="text-sm mt-1">Add your first athlete to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {athletes.map((athlete: Athlete) => (
            <AthleteCard key={athlete.id} athlete={athlete} />
          ))}
        </div>
      )}
    </div>
  )
}
