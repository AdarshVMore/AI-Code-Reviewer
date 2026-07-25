'use client'

import { motion } from 'motion/react'
import { StatCard, Card, SectionLabel, EmptyState, TileWaveSkeletonPage } from '@/components/ui'
import { Topbar } from '@/components/layout/Topbar'
import { useDashboard } from '@/hooks/useDashboard'
import { FORCE_LOADING } from '@/lib/forceLoading'
import type { fetchDashboardData } from '@/lib/api/dashboard'
import { useRouter } from 'next/navigation'
import { AlertTriangle, GitBranch, GitPullRequest, ListChecks } from 'lucide-react'

type DashboardData = Awaited<ReturnType<typeof fetchDashboardData>>
type PR = DashboardData['recentPR'][number]
type Issue = DashboardData['issues'][number]
type Repo = DashboardData['activeRepo'][number]

const listStagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
}

export default function DashboardPage() {
  const { data, loading, error } = useDashboard()
  const router = useRouter()

  if (FORCE_LOADING || loading) {
    return (
      <div className="flex h-full min-h-0 flex-col overflow-hidden">
        <Topbar title="Dashboard" />
        <div className="min-h-0 flex-1 overflow-hidden">
          <TileWaveSkeletonPage layout="dashboard" />
        </div>
      </div>
    )
  }
  if (error) return <div className="px-8 py-7 text-sm text-text-secondary">{error}</div>

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <Topbar title="Dashboard" />

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-8 py-4 w-full">
        {/* Stats — fixed height */}
        <div className="grid shrink-0 grid-cols-4 gap-3">
          <StatCard compact value={String(data?.stats.totalReviews ?? 0)} label="PRs reviewed" />
          <StatCard compact value={String(data?.stats.totalIssues ?? 0)} label="Issues found" />
          <StatCard compact value={String(data?.stats.totalRepos ?? 0)} label="Active repos" />
        </div>

        {/* Recent reviews — takes remaining middle space, scrolls internally if needed */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <SectionLabel className="mb-2 shrink-0">Recent reviews</SectionLabel>
          <div className="relative min-h-0 flex-1">
            <motion.div
              variants={listStagger}
              initial="hidden"
              animate="show"
              className="h-full overflow-y-auto pr-1 [mask-image:linear-gradient(to_bottom,black_0%,black_calc(100%-48px),transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_0%,black_calc(100%-48px),transparent_100%)]"
            >
              {data?.recentPR.length === 0 && (
                <EmptyState
                  message="No reviews yet."
                  subMessage="Open a PR on a connected repo to see it here."
                  icon={GitPullRequest}
                />
              )}
              {data?.recentPR.map((pr: PR) => (
                <Card hoverable key={pr.id} className="mb-2 !p-3">
                  <div className="flex items-start justify-between gap-4">
                    <div
                      className="min-w-0 cursor-pointer"
                      onClick={() => {
                        router.push(`/repo/${pr.repository.owner}/${pr.repository.name}/pr/${pr.prNumber}`)
                      }}
                    >
                      <p className="text-sm font-medium text-text-primary truncate">
                        {pr.prTitle ?? `PR #${pr.prNumber}`}
                      </p>
                      <p className="text-xs font-mono text-text-secondary mt-0.5">
                        {pr.repository.owner}/{pr.repository.name} · PR #{pr.prNumber}
                      </p>
                    </div>
                    <span className="text-xs font-mono text-text-tertiary shrink-0">
                      {new Date(pr.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </Card>
              ))}
              {/* Spacer so the last card can scroll fully above the fade */}
              <div className="h-10 shrink-0" aria-hidden />
            </motion.div>
          </div>
        </div>

        {/* Bottom cards — slightly taller, still fits viewport */}
        <div className="grid shrink-0 grid-cols-1 lg:grid-cols-2 gap-3 h-[220px]">
          <Card className="!p-0 overflow-hidden h-full flex flex-col">
            <div className="flex items-center gap-2 px-3.5 pt-3 pb-2 shrink-0">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-severity-med/10 text-severity-med">
                <AlertTriangle size={13} strokeWidth={1.8} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-text-primary leading-tight">Most common issues</p>
                <p className="text-[11px] text-text-tertiary font-mono">
                  {data?.issues.length ?? 0} patterns
                </p>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-3.5 pb-3">
              {data?.issues.length === 0 && <EmptyState message="No issues yet." icon={ListChecks} />}
              <ul className="space-y-2">
                {(data?.issues ?? []).slice(0, 5).map((issue: Issue, i: number) => (
                  <li key={i} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-[10px] text-text-tertiary w-3.5 shrink-0 tabular-nums">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="text-xs text-text-primary truncate" title={issue.problem}>
                        {issue.problem}
                      </span>
                    </div>
                    <span className="shrink-0 rounded-md bg-bg-raised px-1.5 py-0.5 text-[11px] font-mono text-brand tabular-nums">
                      {issue.count}×
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>

          <Card className="!p-0 overflow-hidden h-full flex flex-col">
            <div className="flex items-center gap-2 px-3.5 pt-3 pb-2 shrink-0">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/15 text-brand">
                <GitBranch size={13} strokeWidth={1.8} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-text-primary leading-tight">Active repos</p>
                <p className="text-[11px] text-text-tertiary font-mono">
                  {data?.activeRepo.length ?? 0} connected
                </p>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
              {data?.activeRepo.length === 0 && <EmptyState message="No repos yet." icon={GitBranch} />}
              <ul className="space-y-0.5">
                {data?.activeRepo.map((repo: Repo) => (
                  <li key={repo.id}>
                    <button
                      type="button"
                      onClick={() => router.push(`/repo/${repo.owner}/${repo.name}`)}
                      className="w-full flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors duration-150 hover:bg-bg-raised/80 cursor-pointer group"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border-hairline bg-bg-raised text-brand group-hover:border-brand/30 transition-colors">
                        <GitBranch size={12} strokeWidth={1.8} />
                      </div>
                      <p className="min-w-0 flex-1 text-xs font-mono text-text-primary truncate group-hover:text-brand transition-colors">
                        {repo.owner}/
                        <span className="text-text-secondary group-hover:text-brand/80">{repo.name}</span>
                      </p>
                      <div className="shrink-0 text-right">
                        <p className="text-xs font-mono font-medium text-text-primary tabular-nums leading-none">
                          {repo._count.reviews}
                        </p>
                        <p className="text-[9px] font-mono text-text-tertiary uppercase tracking-wide mt-0.5">
                          reviews
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
