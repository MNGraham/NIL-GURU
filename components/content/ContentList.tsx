import type { ContentPiece } from '@/types'

interface Props { items: ContentPiece[] }

const platformColors: Record<string, string> = {
  instagram: 'bg-pink-900 text-pink-300',
  twitter:   'bg-sky-900 text-sky-300',
  tiktok:    'bg-purple-900 text-purple-300',
  linkedin:  'bg-blue-900 text-blue-300',
}

export default function ContentList({ items }: Props) {
  if (!items.length) {
    return (
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 flex items-center justify-center text-gray-500 text-sm">
        Generated content will appear here.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.id} className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-xs px-2 py-0.5 rounded-full ${platformColors[item.platform] ?? ''}`}>
              {item.platform}
            </span>
            <span className="text-xs text-gray-500">{item.content_type}</span>
            <span className="text-xs text-gray-500 ml-auto">
              {new Date(item.created_at).toLocaleDateString()}
            </span>
          </div>
          <p className="text-sm text-gray-200 whitespace-pre-wrap mb-3">{item.body}</p>
          {item.hashtags.length > 0 && (
            <p className="text-xs text-indigo-400">
              {item.hashtags.map((h) => `#${h.replace(/^#/, '')}`).join(' ')}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
