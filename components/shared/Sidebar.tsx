'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const nav = [
  { href: '/dashboard/athletes',    label: 'Athletes',    icon: '🏃' },
  { href: '/dashboard/performance', label: 'Performance', icon: '📊' },
  { href: '/dashboard/content',     label: 'Content',     icon: '✍️' },
  { href: '/dashboard/brands',      label: 'Brands',      icon: '🤝' },
  { href: '/dashboard/profile',     label: 'NIL Profile', icon: '⭐' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col p-4">
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
          NIL-GURU
        </h2>
      </div>
      <nav className="flex flex-col gap-1">
        {nav.map(({ href, label, icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              pathname.startsWith(href)
                ? 'bg-indigo-600 text-white'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <span>{icon}</span>
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
