'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Athlete, NilProfile } from '@/types'

interface Props {
  athlete: Athlete
  nilProfile: NilProfile | null
}

export default function NilProfileCard({ athlete, nilProfile }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function generate() {
    setLoading(true)
    await fetch('/api/profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ athlete_id: athlete.id }),
    })
    router.refresh()
    setLoading(false)
  }

  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">{athlete.sport} — {athlete.school ?? 'Unknown School'}</h3>
        <button
          onClick={generate}
          disabled={loading}
          className="text-xs bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg transition-colors"
        >
          {loading ? 'Generating...' : nilProfile ? 'Regenerate' : 'Generate Profile'}
        </button>
      </div>
      {nilProfile ? (
        <>
          <p className="text-indigo-300 font-medium mb-2">{nilProfile.headline}</p>
          <p className="text-sm text-gray-300 mb-4">{nilProfile.bio}</p>
          <div className="flex flex-wrap gap-2">
            {nilProfile.categories.map((cat) => (
              <span key={cat} className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded-full">
                {cat}
              </span>
            ))}
          </div>
        </>
      ) : (
        <p className="text-sm text-gray-500">No profile generated yet.</p>
      )}
    </div>
  )
}
