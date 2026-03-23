import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function LoginPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard/athletes')

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="w-full max-w-md p-8 bg-gray-900 rounded-2xl shadow-xl">
        <h1 className="text-3xl font-bold text-white mb-2">Athlete Revenue Engine</h1>
        <p className="text-gray-400 mb-8">Sign in to manage your NIL profile</p>
        {/* LoginForm is a Client Component — see components/auth/ */}
        <LoginFormPlaceholder />
      </div>
    </main>
  )
}

// Placeholder — replaced by <LoginForm /> client component
function LoginFormPlaceholder() {
  return (
    <div className="text-gray-500 text-sm text-center">
      [ LoginForm client component ]
    </div>
  )
}
