'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Avatar } from '@/components/ui'

const navItems = [
  {
    label: 'Dashboard',
    href: '/',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="1" width="6" height="6" rx="1" />
        <rect x="9" y="1" width="6" height="6" rx="1" />
        <rect x="1" y="9" width="6" height="6" rx="1" />
        <rect x="9" y="9" width="6" height="6" rx="1" />
      </svg>
    ),
  },
  {
    label: 'Repos',
    href: '/repos',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="8" cy="2" r="1.5" />
        <circle cx="3" cy="13" r="1.5" />
        <circle cx="13" cy="13" r="1.5" />
        <line x1="8" y1="3.5" x2="8" y2="7" />
        <line x1="8" y1="7" x2="3" y2="11.5" />
        <line x1="8" y1="7" x2="13" y2="11.5" />
      </svg>
    ),
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const user = useUser()

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    if (href === '/repos') return pathname.startsWith('/repos') || pathname.startsWith('/repo/')
    return pathname.startsWith(href)
  }

  return (
    <aside className="w-56 h-screen bg-bg-surface border-r border-bg-border flex flex-col shrink-0">
      <div className="px-5 py-5 border-b border-bg-border">
        <span className="font-mono text-sm font-medium text-brand">ReviewPilot</span>
      </div>

      <nav className="flex-1 px-2 py-4 flex flex-col gap-0.5">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border-transparent text-sm transition-all duration-150 ${
              isActive(item.href)
                ? 'bg-bg-raised text-text-primary  border-transparent'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-raised border-transparent'
            }`}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="mt-auto border-t border-bg-border px-4 py-4">
        <div className="flex items-center gap-3">
          <Avatar src={user?.githubAvatar ?? ''} username={user?.githubUsername ?? ''} size="md" />
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-mono text-text-secondary truncate">{user?.githubUsername ?? '...'}</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
