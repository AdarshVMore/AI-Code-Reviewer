'use client'

import Link from 'next/link'
import { GitBranch, LayoutDashboard, Sparkles } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { Avatar } from '@/components/ui'
import { useUser } from '@/hooks/useUser'

const navItems = [
  {
    label: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    label: 'Repos',
    href: '/repos',
    icon: GitBranch,
  },
  {
    label: 'AI Usage',
    href: '/ai-usage',
    icon: Sparkles,
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
        <span className="font-mono text-sm font-medium text-brand">CodeRefyn</span>
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
            <item.icon className="shrink-0" size={16} strokeWidth={1.8} />
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
