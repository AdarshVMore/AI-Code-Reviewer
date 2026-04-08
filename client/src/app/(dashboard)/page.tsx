'use client'

import { StatCard, Card, SectionLabel, Spinner } from '@/components/ui'
import { Topbar } from '@/components/layout/Topbar'
import { useDashboard } from '@/hooks/useDashboard'
import type { fetchDashboardData } from '@/lib/api/dashboard'

type DashboardData = Awaited<ReturnType<typeof fetchDashboardData>>
type PR = DashboardData['recentPR'][number]
type Issue = DashboardData['issues'][number]
type Repo = DashboardData['activeRepo'][number]

export default function DashboardPage() {
  const { data, loading, error } = useDashboard()

  if (loading) return <div className="flex items-center justify-center h-full"><Spinner /></div>
  if (error) return <div className="px-8 py-7 text-sm text-text-secondary">{error}</div>

  return (
    <>
      <Topbar title="Dashboard" />
      <div className="px-8 py-7 max-w-7xl mx-auto">
        <div className="grid grid-cols-4 gap-4 mb-8">
          <StatCard value={String(data?.stats.totalReviews ?? 0)} label="PRs reviewed" trend="" trendDirection="neutral" />
          <StatCard value={String(data?.stats.totalIssues ?? 0)} label="Issues found" trend="" trendDirection="neutral" />
          <StatCard value={String(data?.stats.totalRepos ?? 0)} label="Active repos" trend="" trendDirection="neutral" />
        </div>

        <SectionLabel>Recent reviews</SectionLabel>
        <div className="mb-6">
          {data?.recentPR.length === 0 && (
            <p className="text-sm text-text-secondary">No reviews yet.</p>
          )}
          {data?.recentPR.map((pr: PR) => (
            <Card hoverable key={pr.id} className="mb-3 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{pr.prTitle ?? `PR #${pr.prNumber}`}</p>
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
        </div>

        <div className="grid grid-cols-2 gap-4 mt-6">
          <Card>
            <SectionLabel>Most common issues</SectionLabel>
            {data?.issues.length === 0 && <p className="text-sm text-text-secondary">No issues yet.</p>}
            {data?.issues.map((issue: Issue, i: number) => (
              <div key={i} className="flex items-center gap-3 mb-3 last:mb-0">
                <span className="text-xs font-medium text-text-secondary w-48 shrink-0 truncate">{issue.problem}</span>
                <span className="text-xs font-mono text-text-secondary w-5 text-right">{issue.count}</span>
              </div>
            ))}
          </Card>

          <Card>
            <SectionLabel>Active repos</SectionLabel>
            {data?.activeRepo.length === 0 && <p className="text-sm text-text-secondary">No repos yet.</p>}
            {data?.activeRepo.map((repo: Repo) => (
              <div key={repo.id} className="flex items-center justify-between py-2.5 border-b border-bg-border last:border-0">
                <span className="text-sm font-mono text-text-primary">{repo.owner}/{repo.name}</span>
                <span className="text-xs font-mono text-text-tertiary">{repo._count.reviews} reviews</span>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </>
  )
}
