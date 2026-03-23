'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewAthleteButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleCreate() {
    setLoading(true)
    const res = await fetch('/api/athletes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sport: 'Football', is_public: false, stats: {} }),
    })
    if (res.ok) {
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <button
      onClick={handleCreate}
      disabled={loading}
      className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
    >
      {loading ? 'Creating...' : '+ New Athlete'}
    </button>
  )
}
