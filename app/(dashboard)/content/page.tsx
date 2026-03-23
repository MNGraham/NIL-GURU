import { createClient } from '@/lib/supabase/server'
import ContentGenerator from '@/components/content/ContentGenerator'
import ContentList from '@/components/content/ContentList'
import type { Athlete, ContentPiece } from '@/types'

export default async function ContentPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: athletes }, { data: content }] = await Promise.all([
    supabase.from('athletes').select('*').eq('profile_id', user!.id),
    supabase
      .from('content_pieces')
      .select('*')
      .in('athlete_id',
        supabase.from('athletes').select('id').eq('profile_id', user!.id)
      )
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8">Social Content</h1>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <ContentGenerator athletes={(athletes ?? []) as Athlete[]} />
        <ContentList items={(content ?? []) as ContentPiece[]} />
      </div>
    </div>
  )
}
