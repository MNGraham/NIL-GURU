'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { PerformanceEntry, PerformanceMedia, StatRow } from '@/types'

interface Props {
  entries: PerformanceEntry[]
}

export default function PerformanceHistory({ entries: initialEntries }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [entries, setEntries] = useState(initialEntries)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  function toggle(id: string) {
    setExpanded((prev) => (prev === id ? null : id))
  }

  async function deleteEntry(id: string) {
    if (!confirm('Delete this entry? This cannot be undone.')) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/performance/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setEntries((prev) => prev.filter((e) => e.id !== id))
        if (expanded === id) setExpanded(null)
        router.refresh()
      }
    } finally {
      setDeleting(null)
    }
  }

  function publicUrl(path: string) {
    const { data } = supabase.storage.from('performance-media').getPublicUrl(path)
    return data.publicUrl
  }

  if (!entries.length) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-center text-gray-500">
        <ClipboardIcon />
        <p className="mt-3 text-sm">No entries yet.</p>
        <p className="text-xs mt-1">Fill out the form to log your first session.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => {
        const isOpen = expanded === entry.id
        const statCount = (entry.stats as StatRow[]).filter((s) => s.label && s.value).length
        const mediaCount = entry.media?.length ?? 0

        return (
          <div
            key={entry.id}
            className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden"
          >
            {/* ── Row header ── */}
            <button
              type="button"
              onClick={() => toggle(entry.id)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-800/50 transition-colors text-left"
            >
              <div className="flex items-center gap-4">
                <div className="text-sm font-medium text-white">
                  {formatDate(entry.recorded_at)}
                </div>
                <div className="flex items-center gap-2">
                  {statCount > 0 && (
                    <Badge icon={<ChartIcon />} label={`${statCount} stat${statCount !== 1 ? 's' : ''}`} />
                  )}
                  {mediaCount > 0 && (
                    <Badge icon={<PhotoIcon />} label={`${mediaCount} file${mediaCount !== 1 ? 's' : ''}`} />
                  )}
                  {entry.notes && (
                    <Badge icon={<NoteIcon />} label="Note" />
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); deleteEntry(entry.id) }}
                  disabled={deleting === entry.id}
                  className="p-1.5 rounded-md text-gray-600 hover:text-red-400 hover:bg-gray-800 transition-colors disabled:opacity-40"
                  aria-label="Delete entry"
                >
                  <TrashIcon />
                </button>
                <ChevronIcon open={isOpen} />
              </div>
            </button>

            {/* ── Expanded detail ── */}
            {isOpen && (
              <div className="border-t border-gray-800 px-5 py-5 space-y-5">

                {/* Stats table */}
                {(entry.stats as StatRow[]).filter((s) => s.label && s.value).length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                      Stats
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {(entry.stats as StatRow[])
                        .filter((s) => s.label && s.value)
                        .map((stat, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-2.5"
                          >
                            <span className="text-sm text-gray-300">{stat.label}</span>
                            <span className="text-sm font-semibold text-white tabular-nums">
                              {stat.value}
                              {stat.unit && (
                                <span className="text-xs text-gray-400 ml-1 font-normal">{stat.unit}</span>
                              )}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Media grid */}
                {entry.media && entry.media.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                      Media
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {entry.media.map((m: PerformanceMedia) => (
                        <MediaThumb key={m.id} media={m} publicUrl={publicUrl(m.storage_path)} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {entry.notes && (
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                      Notes
                    </h4>
                    <p className="text-sm text-gray-300 whitespace-pre-wrap bg-gray-800 rounded-lg px-4 py-3">
                      {entry.notes}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Sub-components ───────────────────────────────────────────

function MediaThumb({ media, publicUrl }: { media: PerformanceMedia; publicUrl: string }) {
  const isVideo = media.mime_type.startsWith('video/')

  if (isVideo) {
    return (
      <a
        href={publicUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-indigo-500 transition-colors"
      >
        <div className="h-24 flex items-center justify-center">
          <PlayIcon />
        </div>
        <div className="px-2 py-1.5">
          <p className="text-xs text-gray-400 truncate">{media.file_name}</p>
        </div>
      </a>
    )
  }

  return (
    <a
      href={publicUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-lg overflow-hidden border border-gray-700 hover:border-indigo-500 transition-colors"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={publicUrl}
        alt={media.file_name}
        className="w-full h-24 object-cover"
      />
    </a>
  )
}

function Badge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="flex items-center gap-1 text-xs text-gray-400 bg-gray-800 rounded-full px-2 py-0.5">
      {icon}
      {label}
    </span>
  )
}

function formatDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-4 h-4 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`}
      fill="none" viewBox="0 0 24 24" stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  )
}

function ChartIcon() {
  return (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  )
}

function PhotoIcon() {
  return (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
  )
}

function NoteIcon() {
  return (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  )
}

function ClipboardIcon() {
  return (
    <svg className="w-10 h-10 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
    </svg>
  )
}

function PlayIcon() {
  return (
    <svg className="w-10 h-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
    </svg>
  )
}
