'use client'

import { useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, SectionLabel, Avatar } from '@/components/ui'
import { Topbar } from '@/components/layout/Topbar'
import { useRepos } from '@/hooks/useRepos'
import { useAllPRs } from '@/hooks/useAllPRs'
import { useCollaborators } from '@/hooks/useCollaborator'

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hr ago`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'yesterday'
  return `${days} days ago`
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-bg-raised border border-bg-border rounded-lg px-3 py-2 text-xs font-mono text-text-primary">
      {label}: {payload[0].value}
    </div>
  )
}

type TabId = 'reviews' | 'analytics' | 'collaborators' | 'settings'

const tabs: { id: TabId; label: string }[] = [
  { id: 'reviews', label: 'Reviews' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'collaborators', label: 'Collaborators' },
  { id: 'settings', label: 'Settings' },
]

type StrictnessId = 'strict' | 'balanced' | 'light'

const strictnessOptions: { id: StrictnessId; label: string; description: string }[] = [
  { id: 'strict', label: 'Strict', description: 'Catches everything, slower reviews' },
  { id: 'balanced', label: 'Balanced', description: 'Recommended for most teams' },
  { id: 'light', label: 'Light', description: 'Critical bugs only' },
]

const focusAreaOptions = [
  { id: 'security', label: 'Security' },
  { id: 'performance', label: 'Performance' },
  { id: 'codeQuality', label: 'Code quality' },
  { id: 'errorHandling', label: 'Error handling' },
  { id: 'types', label: 'Types' },
]

const categoryData = [
  { category: 'Security', count: 31 },
  { category: 'Error handling', count: 24 },
  { category: 'Code quality', count: 18 },
  { category: 'Performance', count: 12 },
  { category: 'Types', count: 7 },
]

export default function RepoPage() {
  const params = useParams()
  const router = useRouter()
  const owner = params.owner as string
  const repo = params.repo as string

  const [activeTab, setActiveTab] = useState<TabId>('reviews')
  const [strictness, setStrictness] = useState<StrictnessId>('balanced')
  const [checkedAreas, setCheckedAreas] = useState(['security', 'errorHandling', 'codeQuality'])

  const { repos } = useRepos()
  const currentRepo = repos.find((r) => r.owner === owner && r.name === repo)
  const repoId = currentRepo?.id ?? ''

  const { prs, loading } = useAllPRs(repoId)
  const { allCollaborators } = useCollaborators(repoId)

  const reviewsData = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const pr of prs) {
      const date = new Date(pr.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })
      counts[date] = (counts[date] ?? 0) + 1
    }
    return Object.entries(counts).map(([date, count]) => ({ date, count }))
  }, [prs])

  function toggleArea(id: string) {
    setCheckedAreas((prev) => prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id])
  }

  return (
    <>
      <Topbar title={`${owner}/${repo}`} subtitle={`${prs.length} PRs reviewed`} />
      <div className="px-8 py-7 max-w-7xl mx-auto">

        <div className="flex border-b border-bg-border mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`text-sm px-4 py-2.5 font-medium cursor-pointer transition-colors duration-150 bg-transparent border-none ${
                activeTab === tab.id
                  ? 'text-text-primary border-b-2 border-brand -mb-px'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'reviews' && (
          <>
            {loading && <p className="text-sm text-text-secondary">Loading...</p>}
            {!loading && prs.length === 0 && (
              <p className="text-sm text-text-secondary">No PRs reviewed yet.</p>
            )}
            {prs.map((pr) => (
              <Card
                key={pr.id}
                hoverable
                className="mb-3 p-4"
                onClick={() => router.push(`/repo/${owner}/${repo}/pr/${pr.prNumber}`)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {pr.prTitle ?? `PR #${pr.prNumber}`}
                    </p>
                    <p className="text-xs font-mono text-text-secondary mt-0.5">
                      {owner}/{repo} · PR #{pr.prNumber}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-mono text-text-tertiary">{timeAgo(pr.createdAt)}</span>
                  </div>
                </div>
                {pr.summary && (
                  <p className="text-xs text-text-secondary mt-2 line-clamp-2">{pr.summary}</p>
                )}
              </Card>
            ))}
          </>
        )}

        {activeTab === 'analytics' && (
          <div>
            <SectionLabel>Reviews over time</SectionLabel>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={reviewsData}>
                <XAxis dataKey="date" tick={{ fill: '#555555', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#555555', fontSize: 11 }} axisLine={false} tickLine={false} />
                <CartesianGrid stroke="#262626" vertical={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#5b6af0"
                  strokeWidth={1.5}
                  fill="#5b6af0"
                  fillOpacity={0.08}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>

            <SectionLabel className="mt-6">Issues by category</SectionLabel>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={categoryData}>
                <XAxis dataKey="category" tick={{ fill: '#555555', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#555555', fontSize: 11 }} axisLine={false} tickLine={false} />
                <CartesianGrid stroke="#262626" vertical={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#5b6af0" fillOpacity={0.85} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {activeTab === 'collaborators' && (
          <div>
            <div className="flex items-center py-2 border-b border-bg-border mb-1 text-xs text-text-tertiary uppercase tracking-wide">
              <span className="flex-1">User</span>
              <span className="w-24 text-right">Access</span>
            </div>
            {allCollaborators.length === 0 && (
              <p className="text-sm text-text-secondary py-4">No collaborators found.</p>
            )}
            {allCollaborators.map((c) => (
              <div key={c.id} className="flex items-center py-3 border-b border-bg-border last:border-0">
                <div className="flex-1 flex items-center gap-2">
                  <Avatar src={c.avatar_url} username={c.login} size="sm" />
                  <span className="text-sm font-mono text-text-secondary">{c.login}</span>
                </div>
                <span className="w-24 text-right text-xs font-mono text-text-tertiary">
                  {c.permissions?.admin ? 'admin' : c.permissions?.push ? 'write' : 'read'}
                </span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'settings' && (
          <div>
            <SectionLabel>Review strictness</SectionLabel>
            {strictnessOptions.map((opt) => (
              <div
                key={opt.id}
                onClick={() => setStrictness(opt.id)}
                className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer mb-2 transition-colors duration-150 ${
                  strictness === opt.id ? 'border-brand bg-brand-muted' : 'border-bg-border hover:bg-bg-raised'
                }`}
              >
                <div className={`w-4 h-4 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center ${
                  strictness === opt.id ? 'border-brand' : 'border-bg-muted'
                }`}>
                  {strictness === opt.id && <div className="w-2 h-2 rounded-full bg-brand" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">{opt.label}</p>
                  <p className="text-xs text-text-secondary mt-0.5">{opt.description}</p>
                </div>
              </div>
            ))}

            <SectionLabel>Focus areas</SectionLabel>
            {focusAreaOptions.map((area) => {
              const checked = checkedAreas.includes(area.id)
              return (
                <div
                  key={area.id}
                  onClick={() => toggleArea(area.id)}
                  className="flex items-center gap-2.5 py-1.5 cursor-pointer"
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                    checked ? 'bg-brand border-brand' : 'border-bg-border bg-bg-surface'
                  }`}>
                    {checked && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5l2.5 2.5L8 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-text-secondary hover:text-text-primary">{area.label}</span>
                </div>
              )
            })}

            <SectionLabel>Ignore paths</SectionLabel>
            <textarea
              className="w-full bg-bg-surface border border-bg-border rounded-xl p-3 font-mono text-sm text-text-primary placeholder-text-tertiary resize-none h-24 focus:outline-none focus:border-brand/50 transition-colors"
              placeholder={"*.test.ts\nmigrations/\ndist/"}
            />

            <button
              onClick={() => console.log('save settings')}
              className="mt-6 bg-brand hover:bg-brand-hover text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors duration-150 active:scale-95"
            >
              Save settings
            </button>
          </div>
        )}

      </div>
    </>
  )
}
