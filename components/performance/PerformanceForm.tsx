'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import MediaUploader, { type PendingFile } from './MediaUploader'
import type { Athlete, StatRow } from '@/types'

// ----- Sport-specific stat presets -----
const SPORT_PRESETS: Record<string, StatRow[]> = {
  Football: [
    { label: '40-Yard Dash', value: '', unit: 'sec' },
    { label: 'Vertical Jump', value: '', unit: 'in' },
    { label: 'Bench Press Reps (225 lb)', value: '', unit: 'reps' },
    { label: 'Broad Jump', value: '', unit: 'in' },
    { label: '3-Cone Drill', value: '', unit: 'sec' },
  ],
  Basketball: [
    { label: 'Standing Vertical', value: '', unit: 'in' },
    { label: 'Max Vertical', value: '', unit: 'in' },
    { label: 'Lane Agility', value: '', unit: 'sec' },
    { label: '3/4 Court Sprint', value: '', unit: 'sec' },
    { label: 'Bench Press Max', value: '', unit: 'lbs' },
  ],
  Baseball: [
    { label: 'Exit Velocity', value: '', unit: 'mph' },
    { label: '60-Yard Dash', value: '', unit: 'sec' },
    { label: 'Fastball Velocity', value: '', unit: 'mph' },
    { label: 'Pop Time', value: '', unit: 'sec' },
  ],
  Soccer: [
    { label: '40m Sprint', value: '', unit: 'sec' },
    { label: 'Beep Test Level', value: '', unit: '' },
    { label: 'Vertical Jump', value: '', unit: 'cm' },
    { label: 'Max Speed', value: '', unit: 'mph' },
  ],
  Track: [
    { label: '100m Time', value: '', unit: 'sec' },
    { label: '200m Time', value: '', unit: 'sec' },
    { label: '400m Time', value: '', unit: 'sec' },
    { label: 'Long Jump', value: '', unit: 'm' },
  ],
}

const BLANK_STAT: StatRow = { label: '', value: '', unit: '' }

interface Props {
  athletes: Athlete[]
  onSaved: () => void
  onAthleteChange?: (id: string) => void
}

export default function PerformanceForm({ athletes, onSaved, onAthleteChange }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [athleteId, setAthleteId] = useState(athletes[0]?.id ?? '')
  const [recordedAt, setRecordedAt] = useState(() => new Date().toISOString().split('T')[0])
  const [stats, setStats] = useState<StatRow[]>(() => {
    const sport = athletes[0]?.sport ?? ''
    return SPORT_PRESETS[sport] ?? [{ ...BLANK_STAT }]
  })
  const [notes, setNotes] = useState('')
  const [files, setFiles] = useState<PendingFile[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // When athlete changes, pre-load sport preset
  function handleAthleteChange(id: string) {
    setAthleteId(id)
    const athlete = athletes.find((a) => a.id === id)
    const preset = athlete?.sport ? (SPORT_PRESETS[athlete.sport] ?? [{ ...BLANK_STAT }]) : [{ ...BLANK_STAT }]
    setStats(preset.map((s) => ({ ...s, value: '' })))
    onAthleteChange?.(id)
  }

  // Stat row helpers
  function updateStat(idx: number, field: keyof StatRow, val: string) {
    setStats((prev) => prev.map((s, i) => i === idx ? { ...s, [field]: val } : s))
  }

  function addStat() {
    setStats((prev) => [...prev, { ...BLANK_STAT }])
  }

  function removeStat(idx: number) {
    setStats((prev) => prev.filter((_, i) => i !== idx))
  }

  // Upload a single file to Supabase Storage, return storage path
  async function uploadFile(pf: PendingFile, uid: string): Promise<string> {
    const ext = pf.file.name.split('.').pop()
    const path = `${uid}/${athleteId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage
      .from('performance-media')
      .upload(path, pf.file, { contentType: pf.file.type, upsert: false })
    if (error) throw new Error(error.message)
    return path
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    const filledStats = stats.filter((s) => s.label.trim() && s.value.trim())
    if (filledStats.length === 0 && files.length === 0 && !notes.trim()) {
      setError('Add at least one stat, upload a file, or write a note.')
      return
    }

    setSaving(true)

    try {
      // 1. Get current user id for storage path namespacing
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // 2. Upload files and collect paths
      const uploadedMedia: Array<{
        storage_path: string
        file_name: string
        mime_type: string
        size_bytes: number
      }> = []

      // Update uploading state visually
      setFiles((prev) => prev.map((f) => ({ ...f, uploading: true, error: null })))

      for (const pf of files) {
        try {
          const storagePath = await uploadFile(pf, user.id)
          uploadedMedia.push({
            storage_path: storagePath,
            file_name: pf.file.name,
            mime_type: pf.file.type,
            size_bytes: pf.file.size,
          })
          setFiles((prev) =>
            prev.map((f) => f.id === pf.id ? { ...f, uploading: false, storagePath } : f)
          )
        } catch (uploadErr) {
          const msg = uploadErr instanceof Error ? uploadErr.message : 'Upload failed'
          setFiles((prev) =>
            prev.map((f) => f.id === pf.id ? { ...f, uploading: false, error: msg } : f)
          )
        }
      }

      // 3. Save entry to API
      const res = await fetch('/api/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          athlete_id: athleteId,
          recorded_at: recordedAt,
          stats: filledStats,
          notes: notes.trim() || undefined,
          media: uploadedMedia,
        }),
      })

      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error ?? 'Failed to save')
      }

      // 4. Reset form
      setSuccess(true)
      setNotes('')
      setFiles([])
      const athlete = athletes.find((a) => a.id === athleteId)
      const preset = athlete?.sport ? (SPORT_PRESETS[athlete.sport] ?? [{ ...BLANK_STAT }]) : [{ ...BLANK_STAT }]
      setStats(preset.map((s) => ({ ...s, value: '' })))
      onSaved()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const currentAthlete = athletes.find((a) => a.id === athleteId)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ── Header row: athlete + date ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Athlete</label>
          <select
            value={athleteId}
            onChange={(e) => handleAthleteChange(e.target.value)}
            disabled={saving}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            {athletes.map((a) => (
              <option key={a.id} value={a.id}>
                {a.sport}{a.school ? ` — ${a.school}` : ''}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Date</label>
          <input
            type="date"
            value={recordedAt}
            onChange={(e) => setRecordedAt(e.target.value)}
            disabled={saving}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* ── Stats section ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            Performance Stats
          </label>
          {currentAthlete?.sport && SPORT_PRESETS[currentAthlete.sport] && (
            <button
              type="button"
              onClick={() =>
                setStats(SPORT_PRESETS[currentAthlete.sport].map((s) => ({ ...s, value: '' })))
              }
              className="text-xs text-indigo-400 hover:text-indigo-300"
            >
              Reset to {currentAthlete.sport} defaults
            </button>
          )}
        </div>

        {/* Column headers */}
        <div className="grid grid-cols-[1fr_120px_80px_28px] gap-2 mb-1.5 px-1">
          <span className="text-xs text-gray-500">Metric</span>
          <span className="text-xs text-gray-500">Value</span>
          <span className="text-xs text-gray-500">Unit</span>
          <span />
        </div>

        <div className="space-y-2">
          {stats.map((stat, idx) => (
            <StatInputRow
              key={idx}
              stat={stat}
              disabled={saving}
              onChange={(field, val) => updateStat(idx, field, val)}
              onRemove={() => removeStat(idx)}
              showRemove={stats.length > 1}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={addStat}
          disabled={saving || stats.length >= 30}
          className="mt-3 flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 disabled:opacity-40"
        >
          <span className="text-base leading-none">+</span> Add stat
        </button>
      </div>

      {/* ── Media upload ── */}
      <div>
        <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
          Photos & Videos
        </label>
        <MediaUploader files={files} onChange={setFiles} disabled={saving} />
      </div>

      {/* ── Notes ── */}
      <div>
        <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">
          Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={saving}
          placeholder="Training conditions, injuries, context for this session…"
          rows={4}
          maxLength={2000}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-600 mt-1 text-right">{notes.length}/2000</p>
      </div>

      {/* ── Feedback + Submit ── */}
      {error && (
        <div className="bg-red-950 border border-red-800 rounded-lg px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-950 border border-green-800 rounded-lg px-4 py-3 text-sm text-green-300">
          Entry saved successfully!
        </div>
      )}

      <button
        type="submit"
        disabled={saving || athletes.length === 0}
        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors text-sm"
      >
        {saving ? 'Saving…' : 'Save Entry'}
      </button>
    </form>
  )
}

// ── Inline stat row ──────────────────────────────────────────
interface StatInputRowProps {
  stat: StatRow
  disabled: boolean
  onChange: (field: keyof StatRow, val: string) => void
  onRemove: () => void
  showRemove: boolean
}

function StatInputRow({ stat, disabled, onChange, onRemove, showRemove }: StatInputRowProps) {
  return (
    <div className="grid grid-cols-[1fr_120px_80px_28px] gap-2 items-center">
      <input
        type="text"
        value={stat.label}
        onChange={(e) => onChange('label', e.target.value)}
        placeholder="e.g. 40-Yard Dash"
        disabled={disabled}
        maxLength={80}
        className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      />
      <input
        type="text"
        inputMode="decimal"
        value={stat.value}
        onChange={(e) => onChange('value', e.target.value)}
        placeholder="4.38"
        disabled={disabled}
        maxLength={40}
        className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      />
      <input
        type="text"
        value={stat.unit}
        onChange={(e) => onChange('unit', e.target.value)}
        placeholder="sec"
        disabled={disabled}
        maxLength={20}
        className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      />
      {showRemove ? (
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          aria-label="Remove stat"
          className="flex items-center justify-center w-7 h-7 rounded-md text-gray-600 hover:text-red-400 hover:bg-gray-800 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      ) : (
        <span />
      )}
    </div>
  )
}
