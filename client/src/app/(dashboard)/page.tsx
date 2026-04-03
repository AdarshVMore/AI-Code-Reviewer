'use client'

import { StatCard, Card, Badge, SectionLabel } from '@/components/ui'
import { Topbar } from '@/components/layout/Topbar'

export default function DashboardPage() {
  return (
    <>
      <Topbar title="Dashboard" />
    <div className="px-8 py-7 max-w-7xl mx-auto">
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard value="47" label="PRs reviewed this month" trend="+12 vs last month" trendDirection="up" />
        <StatCard value="183" label="Issues found" trend="23 high severity" trendDirection="neutral" />
        <StatCard value="8.4s" label="Avg review time" trend="down from 12s" trendDirection="up" />
        <StatCard value="142k" label="Tokens used" trend="68% of plan" trendDirection="neutral" />
      </div>

      <SectionLabel>Recent reviews</SectionLabel>

      <div className="mb-6">
        <Card hoverable className="mb-3 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">Add JWT middleware to API routes</p>
              <p className="text-xs font-mono text-text-secondary mt-0.5">acme/backend · PR #84 · by @adam</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Badge variant="high" label="3 high" />
              <span className="text-xs font-mono text-text-tertiary">2 min ago</span>
            </div>
          </div>
        </Card>

        <Card hoverable className="mb-3 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">Refactor user service to use Prisma</p>
              <p className="text-xs font-mono text-text-secondary mt-0.5">acme/backend · PR #83 · by @priya</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Badge variant="medium" label="2 medium" />
              <span className="text-xs font-mono text-text-tertiary">1 hr ago</span>
            </div>
          </div>
        </Card>

        <Card hoverable className="mb-3 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">Add onboarding flow step 2</p>
              <p className="text-xs font-mono text-text-secondary mt-0.5">acme/frontend · PR #41 · by @adam</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Badge variant="low" label="1 low" />
              <span className="text-xs font-mono text-text-tertiary">3 hr ago</span>
            </div>
          </div>
        </Card>

        <Card hoverable className="mb-3 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">Fix race condition in session handler</p>
              <p className="text-xs font-mono text-text-secondary mt-0.5">acme/backend · PR #82 · by @ravi</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Badge variant="high" label="4 high" />
              <span className="text-xs font-mono text-text-tertiary">5 hr ago</span>
            </div>
          </div>
        </Card>

        <Card hoverable className="mb-3 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">Add rate limiting to auth endpoints</p>
              <p className="text-xs font-mono text-text-secondary mt-0.5">acme/backend · PR #81 · by @priya</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Badge variant="medium" label="2 medium" />
              <span className="text-xs font-mono text-text-tertiary">yesterday</span>
            </div>
          </div>
        </Card>

        <Card hoverable className="mb-3 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">Update tailwind config for dark mode</p>
              <p className="text-xs font-mono text-text-secondary mt-0.5">acme/frontend · PR #40 · by @sarah</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Badge variant="low" label="1 low" />
              <span className="text-xs font-mono text-text-tertiary">2 days ago</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-6">
        <Card>
          <SectionLabel>Most common issues</SectionLabel>
          {[
            { label: 'Security', color: '#ef4444', count: 31, width: '100%' },
            { label: 'Error handling', color: '#f59e0b', count: 24, width: '77%' },
            { label: 'Code quality', color: '#22c55e', count: 18, width: '58%' },
            { label: 'Performance', color: '#3b82f6', count: 12, width: '39%' },
            { label: 'Types', color: '#8b5cf6', count: 7, width: '23%' },
          ].map((row) => (
            <div key={row.label} className="flex items-center gap-3 mb-3 last:mb-0">
              <span className="text-xs font-medium text-text-secondary w-28 shrink-0">{row.label}</span>
              <div className="flex-1 bg-bg-muted rounded-full h-1.5">
                <div className="h-full rounded-full" style={{ width: row.width, backgroundColor: row.color }} />
              </div>
              <span className="text-xs font-mono text-text-secondary w-5 text-right">{row.count}</span>
            </div>
          ))}
        </Card>

        <Card>
          <SectionLabel>Active repos</SectionLabel>
          {[
            { name: 'acme/backend', status: 'active' as const },
            { name: 'acme/frontend', status: 'active' as const },
            { name: 'acme/mobile', status: 'paused' as const },
          ].map((repo) => (
            <div key={repo.name} className="flex items-center justify-between py-2.5 border-b border-bg-border last:border-0">
              <span className="text-sm font-mono text-text-primary">{repo.name}</span>
              <Badge variant={repo.status} />
            </div>
          ))}
        </Card>
      </div>
    </div>
    </>
  )
}
