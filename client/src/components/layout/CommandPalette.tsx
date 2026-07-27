'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Command } from 'cmdk'
import { AnimatePresence, motion } from 'motion/react'
import { GitBranch, LayoutDashboard, Sparkles, ArrowRight, FileCode2 } from 'lucide-react'
import { useRepos } from '@/hooks/useRepos'
import { useDashboard } from '@/hooks/useDashboard'
import type { fetchDashboardData } from '@/lib/api/dashboard'

type RecentPR = Awaited<ReturnType<typeof fetchDashboardData>>['recentPR'][number]

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const { repos } = useRepos()
  const { data } = useDashboard()

  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [close])

  function go(path: string) {
    router.push(path)
    close()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[14vh] px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/60"
            onClick={close}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -4 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
            className="glass-overlay relative w-full max-w-lg rounded-2xl overflow-hidden"
          >
            <Command loop>
              <div className="flex items-center gap-2 px-4 border-b border-border-hairline">
                <span className="font-mono text-xs text-text-tertiary">⌘K</span>
                <Command.Input
                  autoFocus
                  placeholder="Jump to a repo, PR, or page…"
                  className="w-full bg-transparent py-3.5 text-sm text-text-primary placeholder:text-text-tertiary outline-none font-mono"
                />
              </div>
              <Command.List className="max-h-80 overflow-y-auto p-2">
                <Command.Empty className="px-3 py-6 text-center text-sm text-text-secondary">
                  No matches. Try a repo name.
                </Command.Empty>

                <Command.Group heading="Navigate" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-text-tertiary">
                  <Command.Item
                    onSelect={() => go('/')}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-text-primary cursor-pointer data-[selected=true]:bg-brand-muted data-[selected=true]:text-brand"
                  >
                    <LayoutDashboard size={15} strokeWidth={1.8} /> Dashboard
                  </Command.Item>
                  <Command.Item
                    onSelect={() => go('/repos')}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-text-primary cursor-pointer data-[selected=true]:bg-brand-muted data-[selected=true]:text-brand"
                  >
                    <GitBranch size={15} strokeWidth={1.8} /> Repos
                  </Command.Item>
                  <Command.Item
                    onSelect={() => go('/ai-usage')}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-text-primary cursor-pointer data-[selected=true]:bg-brand-muted data-[selected=true]:text-brand"
                  >
                    <Sparkles size={15} strokeWidth={1.8} /> AI Usage
                  </Command.Item>
                </Command.Group>

                {repos.length > 0 && (
                  <Command.Group heading="Repositories" className="mt-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-text-tertiary">
                    {repos.slice(0, 8).map((repo) => (
                      <Command.Item
                        key={repo.id}
                        value={`${repo.owner}/${repo.name}`}
                        onSelect={() => go(`/repo/${repo.owner}/${repo.name}`)}
                        className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm text-text-primary cursor-pointer data-[selected=true]:bg-brand-muted data-[selected=true]:text-brand font-mono"
                      >
                        <span className="flex items-center gap-3 truncate">
                          <GitBranch size={14} strokeWidth={1.8} className="shrink-0 text-text-tertiary" />
                          {repo.owner}/{repo.name}
                        </span>
                        <ArrowRight size={13} className="shrink-0 opacity-0 data-[selected=true]:opacity-100" />
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}

                {data?.recentPR && data.recentPR.length > 0 && (
                  <Command.Group heading="Recent PRs" className="mt-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-text-tertiary">
                    {data.recentPR.slice(0, 6).map((pr: RecentPR) => (
                      <Command.Item
                        key={pr.id}
                        value={`${pr.prTitle ?? ''} PR ${pr.prNumber}`}
                        onSelect={() => go(`/repo/${pr.repository.owner}/${pr.repository.name}/pr/${pr.prNumber}`)}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-text-primary cursor-pointer data-[selected=true]:bg-brand-muted data-[selected=true]:text-brand"
                      >
                        <FileCode2 size={14} strokeWidth={1.8} className="shrink-0 text-text-tertiary" />
                        <span className="truncate">{pr.prTitle ?? `PR #${pr.prNumber}`}</span>
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}
              </Command.List>
            </Command>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
