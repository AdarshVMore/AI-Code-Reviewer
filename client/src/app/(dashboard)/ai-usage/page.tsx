'use client'

import { useState } from 'react'
import {
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { Card, SectionLabel, StatCard, Spinner } from '@/components/ui'
import { Topbar } from '@/components/layout/Topbar'
import useAIUsage from '@/hooks/useAIUsage'

function UsageTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-lg px-3 py-2 text-xs font-mono text-text-primary">
      {label}: <span className="text-brand">{payload[0].value.toLocaleString()}</span> tokens
    </div>
  )
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="2,4 14,4" />
      <path d="M5 4V2h6v2" />
      <rect x="3" y="4" width="10" height="10" rx="1" />
      <line x1="6" y1="7" x2="6" y2="11" />
      <line x1="10" y1="7" x2="10" y2="11" />
    </svg>
  )
}

const glassInput = [
  'w-full glass rounded-xl px-3 py-2',
  'text-sm text-text-primary font-mono',
  'placeholder:text-text-tertiary',
  'focus:outline-none focus:border-brand/40',
  'transition-all duration-150',
].join(' ')

export default function AIUsagePage() {
  const { keys, usage, loading, error, handleAddKey, handleDeleteKey } = useAIUsage()
  const [keyName,    setKeyName]    = useState('')
  const [keyValue,   setKeyValue]   = useState('')
  const [adding,     setAdding]     = useState(false)
  const [addError,   setAddError]   = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  if (loading) return <div className="flex items-center justify-center h-full"><Spinner /></div>
  if (error)   return <div className="px-8 py-7 text-sm text-text-secondary">{error}</div>
   
  async function onAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!keyValue.trim() || !keyName.trim()) return
    setAdding(true)
    setAddError(null)
    try {
      await handleAddKey(keyName.trim(), keyValue.trim())
      setKeyName('')
      setKeyValue('')
    } catch {
      setAddError('Failed to save API key. Please try again.')
    } finally {
      setAdding(false)
    }
  }

  async function onDelete(id: string) {
    setDeletingId(id)
    try { await handleDeleteKey(id) }
    finally { setDeletingId(null) }
  }

  const estimatedCost = usage?.totalTokensThisMonth
    ? ((usage.totalTokensThisMonth / 1_000_000) * 3).toFixed(2)
    : '0.00'

  return (
    <>
      <Topbar title="AI Usage" subtitle="Manage Claude API keys and monitor token consumption" />

      <div className="px-8 py-7 max-w-5xl">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard value={(usage?.totalTokensThisMonth ?? 0).toLocaleString()} label="Tokens this month"   trend="" trendDirection="neutral" />
          <StatCard value={(usage?.avgTokensPerPR        ?? 0).toLocaleString()} label="Avg tokens per PR"   trend="" trendDirection="neutral" />
          <StatCard value={`$${estimatedCost}`}                                  label="Est. cost this month" trend="Based on $3 / 1M tokens" trendDirection="neutral" />
          <StatCard
            value={keys.length > 0 ? 'Your key' : `${usage?.platformReviewsRemaining ?? 0} / ${usage?.platformFreeLimit ?? 5}`}
            label={keys.length > 0 ? 'Billing source' : 'Free reviews left'}
            trend={keys.length > 0 ? 'Reviews use your Claude API key' : 'Platform key until limit reached'}
            trendDirection="neutral"
          />
        </div>

        {keys.length === 0 && (
          <Card className="mb-8 border-brand/20">
            <p className="text-sm text-text-primary">
              No API key configured. You have{' '}
              <span className="text-brand font-mono">{usage?.platformReviewsRemaining ?? 0}</span>{' '}
              of{' '}
              <span className="text-brand font-mono">{usage?.platformFreeLimit ?? 5}</span>{' '}
              free platform reviews remaining.
            </p>
            <p className="text-xs text-text-tertiary mt-2 font-mono">
              Add your Claude API key below for unlimited reviews billed to your account.
            </p>
          </Card>
        )}

        {/* Usage chart */}
        <Card className="mb-8">
          <SectionLabel>Token usage over time</SectionLabel>
          {usage?.usageOverTime?.length ? (
            <div className="h-52 mt-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={usage.usageOverTime} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="tokenGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#a3e635" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#a3e635" stopOpacity={0} />
                    </linearGradient>
                    <filter id="areaGlow">
                      <feGaussianBlur stdDeviation="2.5" result="blur" />
                      <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                  </defs>
                  <CartesianGrid stroke="rgba(163,230,53,0.05)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#3d5e48', fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#3d5e48', fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<UsageTooltip />} />
                  <Area
                    type="monotone" dataKey="tokens"
                    stroke="#a3e635" strokeWidth={2}
                    fill="url(#tokenGrad)" dot={false}
                    style={{ filter: 'url(#areaGlow)' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-text-secondary mt-2">No usage data yet.</p>
          )}
        </Card>

        {/* API Keys */}
        <SectionLabel>Claude API Keys</SectionLabel>

        <Card className="mb-4">
          <form onSubmit={onAdd} className="flex items-end gap-3">
            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
              <label className="text-xs text-brand/50 font-mono uppercase tracking-wider">Key name</label>
              <input
                type="text"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                placeholder="e.g. Production"
                className={glassInput}
              />
            </div>
            <div className="flex flex-col gap-1.5 flex-[2] min-w-0">
              <label className="text-xs text-brand/50 font-mono uppercase tracking-wider">API key</label>
              <input
                type="password"
                value={keyValue}
                onChange={(e) => setKeyValue(e.target.value)}
                placeholder="sk-ant-api03-..."
                className={glassInput}
              />
            </div>
            <button
              type="submit"
              disabled={adding || !keyName.trim() || !keyValue.trim()}
              className="px-4 py-2 bg-brand/10 hover:bg-brand/20 border border-brand/25 text-brand text-sm font-mono rounded-xl glow-brand-sm transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              {adding ? 'Saving…' : 'Add key'}
            </button>
          </form>
          {addError && <p className="text-xs text-red-400 mt-3 font-mono">{addError}</p>}
          <p className="text-xs text-text-tertiary mt-3 font-mono">
            Keys are encrypted at rest and cannot be viewed after saving.
          </p>
        </Card>

        {keys.length === 0 ? (
          <p className="text-sm text-text-secondary">No API keys added yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {keys.map((key) => (
              <Card key={key.id}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="text-sm font-medium text-text-primary">{key.name}</span>
                    <span className="text-xs font-mono text-text-tertiary tracking-widest">{key.maskedKey}</span>
                  </div>
                  <div className="flex items-center gap-5 shrink-0">
                    <span className="text-xs font-mono text-text-tertiary">
                      Added {new Date(key.createdAt).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => onDelete(key.id)}
                      disabled={deletingId === key.id}
                      className="flex items-center gap-1.5 text-xs font-mono text-red-400/70 hover:text-red-400 disabled:opacity-40 transition-colors duration-150"
                    >
                      <TrashIcon />
                      {deletingId === key.id ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
