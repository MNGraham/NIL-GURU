'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Athlete, BrandMatch, MatchStatus } from '@/types'

interface Props {
  athletes: Athlete[]
  initialMatches: BrandMatch[]
}

const statusColors: Record<MatchStatus, string> = {
  suggested:  'bg-gray-800 text-gray-300',
  interested: 'bg-blue-900 text-blue-300',
  contacted:  'bg-yellow-900 text-yellow-300',
  declined:   'bg-red-900 text-red-300',
  deal:       'bg-green-900 text-green-300',
}

export default function BrandMatchDashboard({ athletes, initialMatches }: Props) {
  const router = useRouter()
  const [selectedAthlete, setSelectedAthlete] = useState(athletes[0]?.id ?? '')
  const [matches, setMatches] = useState<BrandMatch[]>(initialMatches)
  const [loading, setLoading] = useState(false)

  async function findMatches() {
    setLoading(true)
    const res = await fetch('/api/brands/matches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ athlete_id: selectedAthlete, limit: 10 }),
    })
    if (res.ok) {
      const { data } = await res.json()
      setMatches(data ?? [])
    }
    setLoading(false)
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <select
          value={selectedAthlete}
          onChange={(e) => setSelectedAthlete(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
        >
          {athletes.map((a) => (
            <option key={a.id} value={a.id}>{a.sport} — {a.school}</option>
          ))}
        </select>
        <button
          onClick={findMatches}
          disabled={loading || !selectedAthlete}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          {loading ? 'Finding matches...' : 'Find Brand Matches'}
        </button>
      </div>

      {!matches.length ? (
        <div className="text-center text-gray-500 mt-16 text-sm">
          Click "Find Brand Matches" to discover NIL opportunities.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {matches.map((match) => (
            <div key={match.id} className="bg-gray-900 rounded-xl p-5 border border-gray-800">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-medium text-white">{match.brand?.name ?? 'Brand'}</h3>
                  <p className="text-xs text-gray-400">{match.brand?.industry}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-lg font-bold text-indigo-400">
                    {match.match_score.toFixed(0)}
                    <span className="text-xs text-gray-500">/100</span>
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[match.status]}`}>
                    {match.status}
                  </span>
                </div>
              </div>
              <ul className="space-y-1">
                {match.reasons.map((r, i) => (
                  <li key={i} className="text-xs text-gray-400 flex gap-1.5">
                    <span className="text-indigo-500 mt-0.5">•</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
