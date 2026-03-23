import Link from 'next/link'
import type { Athlete } from '@/types'

interface Props { athlete: Athlete }

export default function AthleteCard({ athlete }: Props) {
  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-indigo-500 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-white">{athlete.sport}</h3>
          {athlete.position && (
            <p className="text-sm text-gray-400">{athlete.position}</p>
          )}
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ${
          athlete.is_public ? 'bg-green-900 text-green-300' : 'bg-gray-800 text-gray-400'
        }`}>
          {athlete.is_public ? 'Public' : 'Private'}
        </span>
      </div>
      {athlete.school && (
        <p className="text-sm text-gray-400 mb-4">{athlete.school}</p>
      )}
      <div className="flex gap-2 mt-4">
        <Link
          href={`/dashboard/athletes/${athlete.id}`}
          className="text-xs text-indigo-400 hover:text-indigo-300"
        >
          View →
        </Link>
      </div>
    </div>
  )
}
