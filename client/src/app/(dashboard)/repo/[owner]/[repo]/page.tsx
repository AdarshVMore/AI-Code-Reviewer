'use client'

import { useState } from 'react'
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
import { Card, Badge, SectionLabel, Avatar } from '@/components/ui'
import { Topbar } from '@/components/layout/Topbar'

const reviewsData = [
  { date: 'Jan 01', count: 3 },
  { date: 'Jan 02', count: 5 },
  { date: 'Jan 03', count: 2 },
  { date: 'Jan 04', count: 6 },
  { date: 'Jan 05', count: 4 },
  { date: 'Jan 06', count: 8 },
  { date: 'Jan 07', count: 3 },
  { date: 'Jan 08', count: 5 },
  { date: 'Jan 09', count: 7 },
  { date: 'Jan 10', count: 4 },
  { date: 'Jan 11', count: 6 },
  { date: 'Jan 12', count: 3 },
  { date: 'Jan 13', count: 5 },
  { date: 'Jan 14', count: 4 },
]

const categoryData = [
  { category: 'Security', count: 31 },
  { category: 'Error handling', count: 24 },
  { category: 'Code quality', count: 18 },
  { category: 'Performance', count: 12 },
  { category: 'Types', count: 7 },
]

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-bg-raised border border-bg-border rounded-lg px-3 py-2 text-xs font-mono text-text-primary">
      {label}: {payload[0].value}
    </div>
  )
}

type TabId = 'reviews' | 'analytics' | 'collaborators' | 'settings'
type FilterId = 'all' | 'high' | 'medium' | 'low'

const tabs: { id: TabId; label: string }[] = [
  { id: 'reviews', label: 'Reviews' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'collaborators', label: 'Collaborators' },
  { id: 'settings', label: 'Settings' },
]

const reviews = [
  { title: 'Add JWT middleware to API routes', pr: 84, author: 'adam', variant: 'high' as const, label: '3 high', time: '2 min ago' },
  { title: 'Refactor user service to use Prisma', pr: 83, author: 'priya', variant: 'medium' as const, label: '2 medium', time: '1 hr ago' },
  { title: 'Fix race condition in session handler', pr: 82, author: 'ravi', variant: 'high' as const, label: '4 high', time: '5 hr ago' },
  { title: 'Add rate limiting to auth endpoints', pr: 81, author: 'priya', variant: 'medium' as const, label: '2 medium', time: 'yesterday' },
  { title: 'Setup CI/CD pipeline', pr: 80, author: 'adam', variant: 'low' as const, label: '1 low', time: '2 days ago' },
  { title: 'Migrate from mongoose to Prisma', pr: 79, author: 'sarah', variant: 'medium' as const, label: '3 medium', time: '3 days ago' },
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

export default function RepoPage() {
  const params = useParams()
  const router = useRouter()
  const owner = params.owner as string
  const repo = params.repo as string

  const [activeTab, setActiveTab] = useState<TabId>('reviews')
  const [filter, setFilter] = useState<FilterId>('all')
  const [strictness, setStrictness] = useState<StrictnessId>('balanced')
  const [checkedAreas, setCheckedAreas] = useState(['security', 'errorHandling', 'codeQuality'])

  const filteredReviews = filter === 'all' ? reviews : reviews.filter((r) => r.variant === filter)

  function toggleArea(id: string) {
    setCheckedAreas((prev) => prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id])
  }

  return (
    <>
      <Topbar title={`${owner}/${repo}`} subtitle="6 PRs · last reviewed 2 min ago" />
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
            <div className="flex gap-2 mb-5">
              {(['all', 'high', 'medium', 'low'] as FilterId[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`text-xs px-3 py-1.5 rounded-full border cursor-pointer transition-colors duration-150 bg-transparent ${
                    filter === f
                      ? 'bg-bg-raised border-bg-border text-text-primary'
                      : 'border-transparent text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            {filteredReviews.map((r) => (
              <Card
                key={r.pr}
                hoverable
                className="mb-3 p-4"
                onClick={() => router.push(`/repo/${owner}/${repo}/pr/${r.pr}`)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{r.title}</p>
                    <p className="text-xs font-mono text-text-secondary mt-0.5">
                      acme/backend · PR #{r.pr} · by @{r.author}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge variant={r.variant} label={r.label} />
                    <span className="text-xs font-mono text-text-tertiary">{r.time}</span>
                  </div>
                </div>
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
              <span className="w-16 text-right">PRs</span>
              <span className="w-16 text-right">Issues</span>
              <span className="w-20 text-right">High</span>
              <span className="w-32 text-right">Top issue</span>
            </div>
            {[
              { username: 'adam', prs: 18, issues: 47, high: 12, top: 'Security' },
              { username: 'priya', prs: 14, issues: 31, high: 8, top: 'Error handling' },
              { username: 'ravi', prs: 9, issues: 18, high: 3, top: 'Code quality' },
            ].map((c) => (
              <div key={c.username} className="flex items-center py-3 border-b border-bg-border last:border-0">
                <div className="flex-1 flex items-center gap-2">
                  <Avatar src="" username={c.username} size="sm" />
                  <span className="text-sm font-mono text-text-secondary">{c.username}</span>
                </div>
                <span className="w-16 text-right text-sm font-mono text-text-secondary">{c.prs}</span>
                <span className="w-16 text-right text-sm font-mono text-text-secondary">{c.issues}</span>
                <span className="w-20 text-right text-sm font-mono text-text-secondary">{c.high}</span>
                <span className="w-32 text-right text-sm font-mono text-text-secondary">{c.top}</span>
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
