'use client'

import Link from 'next/link'
import { GitBranch, LayoutDashboard, Sparkles, Command } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { motion } from 'motion/react'
import { Avatar, Logo } from '@/components/ui'
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
    <aside className="w-56 h-screen bg-bg-surface/70 backdrop-blur-xl border-r border-border-hairline flex flex-col shrink-0 relative z-10">
      <div className="px-5 py-5 border-b border-border-hairline flex items-center gap-2">
        <Logo size={18} className="text-brand shrink-0" />
        <span className="font-mono text-sm font-medium text-brand tracking-tight">CodeRefyn</span>
      </div>

      <nav className="flex-1 px-2 py-4 flex flex-col gap-0.5">
        {navItems.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors duration-150 ${
                active ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active-pill"
                  className="absolute inset-0 rounded-lg bg-bg-raised"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
              <item.icon className="relative shrink-0" size={16} strokeWidth={1.8} />
              <span className="relative">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="px-4 pb-3">
        <button
          onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
          className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-bg-raised/60 text-text-tertiary hover:text-text-secondary hover:bg-bg-raised transition-colors duration-150 text-xs font-mono"
        >
          <span className="flex items-center gap-2">
            <Command size={12} strokeWidth={2} /> Quick jump
          </span>
          <span className="opacity-60">⌘K</span>
        </button>
      </div>

      <div className="mt-auto border-t border-border-hairline px-4 py-4">
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
