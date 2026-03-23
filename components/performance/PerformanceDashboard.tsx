'use client'

import { useState, useCallback } from 'react'
import PerformanceForm from './PerformanceForm'
import PerformanceHistory from './PerformanceHistory'
import type { Athlete, PerformanceEntry } from '@/types'

interface Props {
  athletes: Athlete[]
  initialEntries: PerformanceEntry[]
}

export default function PerformanceDashboard({ athletes, initialEntries }: Props) {
  const [entries, setEntries] = useState(initialEntries)
  const [selectedAthleteId, setSelectedAthleteId] = useState(athletes[0]?.id ?? '')
  const [loadingHistory, setLoadingHistory] = useState(false)

  // Called by PerformanceForm after a successful save — refetch history
  const refreshHistory = useCallback(async (athleteId?: string) => {
    const id = athleteId ?? selectedAthleteId
    if (!id) return
    setLoadingHistory(true)
    try {
      const res = await fetch(`/api/performance?athlete_id=${id}&limit=20`)
      if (res.ok) {
        const { data } = await res.json()
        setEntries(data ?? [])
      }
    } finally {
      setLoadingHistory(false)
    }
  }, [selectedAthleteId])

  // When athlete selector in the form changes, sync history
  async function handleAthleteChange(id: string) {
    setSelectedAthleteId(id)
    setLoadingHistory(true)
    try {
      const res = await fetch(`/api/performance?athlete_id=${id}&limit=20`)
      if (res.ok) {
        const { data } = await res.json()
        setEntries(data ?? [])
      }
    } finally {
      setLoadingHistory(false)
    }
  }

  if (!athletes.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center text-gray-500">
        <svg className="w-12 h-12 mb-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
        <p className="text-base font-medium text-gray-300">No athletes found</p>
        <p className="text-sm mt-1">
          <a href="/dashboard/athletes" className="text-indigo-400 hover:underline">
            Create an athlete profile
          </a>{' '}
          first to log performance data.
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Performance Log</h1>
        <p className="text-sm text-gray-400 mt-1">
          Track speed, strength, and stats. Upload clips. Add notes.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[480px_1fr] gap-8 items-start">
        {/* ── Left: form card ── */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-base font-semibold text-white mb-6 flex items-center gap-2">
            <PlusCircleIcon />
            New Entry
          </h2>
          <PerformanceForm
            athletes={athletes}
            onAthleteChange={handleAthleteChange}
            onSaved={refreshHistory}
          />
        </div>

        {/* ── Right: history ── */}
        <div className="min-w-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <HistoryIcon />
              History
            </h2>
            {loadingHistory && (
              <span className="text-xs text-gray-500 animate-pulse">Loading…</span>
            )}
          </div>
          <PerformanceHistory entries={entries} />
        </div>
      </div>
    </div>
  )
}

function PlusCircleIcon() {
  return (
    <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function HistoryIcon() {
  return (
    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}
