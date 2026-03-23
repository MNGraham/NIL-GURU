'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Athlete, Platform, ContentType, ContentTone } from '@/types'

interface Props { athletes: Athlete[] }

const platforms: Platform[] = ['instagram', 'twitter', 'tiktok', 'linkedin']
const types: ContentType[] = ['post', 'caption', 'story', 'bio']
const tones: ContentTone[] = ['hype', 'professional', 'casual', 'motivational']

export default function ContentGenerator({ athletes }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    athlete_id: athletes[0]?.id ?? '',
    platform: 'instagram' as Platform,
    content_type: 'post' as ContentType,
    tone: 'hype' as ContentTone,
    context: '',
  })

  function set<K extends keyof typeof form>(k: K, v: typeof form[K]) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  async function generate() {
    setLoading(true)
    await fetch('/api/content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    router.refresh()
    setLoading(false)
  }

  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
      <h2 className="font-semibold mb-4">Generate Content</h2>

      <div className="space-y-4">
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Athlete</label>
          <select
            value={form.athlete_id}
            onChange={(e) => set('athlete_id', e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
          >
            {athletes.map((a) => (
              <option key={a.id} value={a.id}>{a.sport} — {a.school}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Platform</label>
            <select
              value={form.platform}
              onChange={(e) => set('platform', e.target.value as Platform)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
            >
              {platforms.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Type</label>
            <select
              value={form.content_type}
              onChange={(e) => set('content_type', e.target.value as ContentType)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
            >
              {types.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Tone</label>
            <select
              value={form.tone}
              onChange={(e) => set('tone', e.target.value as ContentTone)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
            >
              {tones.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-400 mb-1 block">Context (optional)</label>
          <textarea
            value={form.context}
            onChange={(e) => set('context', e.target.value)}
            placeholder="Recent game highlight, milestone, event..."
            rows={3}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 resize-none"
          />
        </div>

        <button
          onClick={generate}
          disabled={loading || !form.athlete_id}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
        >
          {loading ? 'Generating...' : 'Generate with AI'}
        </button>
      </div>
    </div>
  )
}
