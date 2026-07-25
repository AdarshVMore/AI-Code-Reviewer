'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { KeyRound, Plus, Sparkles, Trash2, Zap } from 'lucide-react'
import { Card, SectionLabel, StatCard, EmptyState, TileWaveSkeletonPage } from '@/components/ui'
import { Topbar } from '@/components/layout/Topbar'
import useAIUsage from '@/hooks/useAIUsage'
import { FORCE_LOADING } from '@/lib/forceLoading'

function UsageTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { value: number }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-overlay rounded-lg px-3 py-2 text-xs font-mono text-text-primary">
      {label}: <span className="text-brand">{payload[0].value.toLocaleString()}</span> tokens
    </div>
  )
}

const fieldClass = [
  'w-full rounded-lg px-3 py-2.5',
  'bg-bg-raised/80 text-sm text-text-primary font-mono',
  'placeholder:text-text-tertiary',
  'border border-border-hairline',
  'focus:outline-none focus:border-brand/50 focus:shadow-[0_0_0_3px_rgba(91,106,240,0.12)]',
  'transition-all duration-150',
].join(' ')

const listStagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
}

export default function AIUsagePage() {
  const { keys, usage, loading, error, handleAddKey, handleDeleteKey } = useAIUsage()
  const [keyName, setKeyName] = useState('')
  const [keyValue, setKeyValue] = useState('')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  if (FORCE_LOADING || loading) {
    return (
      <>
        <Topbar title="AI Usage" subtitle="Keys & token burn" />
        <TileWaveSkeletonPage layout="ai-usage" />
      </>
    )
  }
  if (error) {
    return <div className="px-8 py-7 text-sm text-text-secondary">{error}</div>
  }

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
    try {
      await handleDeleteKey(id)
    } finally {
      setDeletingId(null)
    }
  }

  const estimatedCost = usage?.totalTokensThisMonth
    ? ((usage.totalTokensThisMonth / 1_000_000) * 3).toFixed(2)
    : '0.00'

  const hasOwnKey = keys.length > 0

  return (
    <>
      <Topbar title="AI Usage" subtitle="Keys & token burn" />

      <div className="px-8 py-7 w-full">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            value={(usage?.totalTokensThisMonth ?? 0).toLocaleString()}
            label="Tokens this month"
          />
          <StatCard
            value={(usage?.avgTokensPerPR ?? 0).toLocaleString()}
            label="Avg tokens per PR"
          />
          <StatCard
            value={`$${estimatedCost}`}
            label="Est. cost this month"
            trend="~$3 / 1M tokens"
          />
          <StatCard
            value={
              hasOwnKey
                ? 'Your key'
                : `${usage?.platformReviewsRemaining ?? 0} / ${usage?.platformFreeLimit ?? 5}`
            }
            label={hasOwnKey ? 'Billing source' : 'Free reviews left'}
            trend={hasOwnKey ? 'Reviews bill to your Claude key' : 'Platform key until limit'}
          />
        </div>

        {!hasOwnKey && (
          <Card className="mb-8 !p-0 overflow-hidden">
            <div className="relative px-5 py-4">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    'linear-gradient(105deg, rgba(91,106,240,0.18) 0%, rgba(255,122,69,0.1) 60%, transparent 100%)',
                }}
              />
              <div className="relative flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/15 text-brand">
                  <Zap size={16} strokeWidth={1.8} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-text-primary">
                    No API key yet — you still have{' '}
                    <span className="font-mono text-brand">
                      {usage?.platformReviewsRemaining ?? 0}
                    </span>{' '}
                    of{' '}
                    <span className="font-mono text-brand">
                      {usage?.platformFreeLimit ?? 5}
                    </span>{' '}
                    free platform reviews.
                  </p>
                  <p className="text-xs text-text-tertiary mt-1.5 font-mono">
                    Drop your Claude key below for unlimited reviews on your bill.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        )}

        <Card className="mb-8">
          <div className="flex items-center justify-between gap-3 mb-1">
            <SectionLabel>Token usage over time</SectionLabel>
            <Sparkles size={14} className="text-text-tertiary" strokeWidth={1.6} />
          </div>
          {usage?.usageOverTime?.length ? (
            <div className="h-52 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={usage.usageOverTime}
                  margin={{ top: 8, right: 4, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="tokenGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#5b6af0" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#5b6af0" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: '#55565c', fontFamily: 'monospace' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#55565c', fontFamily: 'monospace' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<UsageTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="tokens"
                    stroke="#5b6af0"
                    strokeWidth={2}
                    fill="url(#tokenGrad)"
                    dot={false}
                    activeDot={{ r: 4, fill: '#5b6af0', stroke: '#0a0b0d', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState
              message="No usage data yet."
              subMessage="Run a few PR reviews and the burn rate will show up here."
              icon={Sparkles}
            />
          )}
        </Card>

        <SectionLabel>Claude API keys</SectionLabel>

        <Card className="mb-4">
          <form onSubmit={onAdd} className="flex flex-col sm:flex-row sm:items-end gap-3">
            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
              <label className="text-xs text-text-tertiary font-mono uppercase tracking-wider">
                Key name
              </label>
              <input
                type="text"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                placeholder="e.g. Production"
                className={fieldClass}
              />
            </div>
            <div className="flex flex-col gap-1.5 flex-[2] min-w-0">
              <label className="text-xs text-text-tertiary font-mono uppercase tracking-wider">
                API key
              </label>
              <input
                type="password"
                value={keyValue}
                onChange={(e) => setKeyValue(e.target.value)}
                placeholder="sk-ant-api03-..."
                className={fieldClass}
              />
            </div>
            <motion.button
              type="submit"
              disabled={adding || !keyName.trim() || !keyValue.trim()}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-brand hover:bg-brand-hover text-white text-sm font-medium shadow-[0_0_20px_rgba(91,106,240,0.3)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              <Plus size={14} strokeWidth={2.2} />
              {adding ? 'Saving…' : 'Add key'}
            </motion.button>
          </form>
          <AnimatePresence>
            {addError && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-xs text-severity-high-text mt-3 font-mono"
              >
                {addError}
              </motion.p>
            )}
          </AnimatePresence>
          <p className="text-xs text-text-tertiary mt-3 font-mono">
            Keys are encrypted at rest and cannot be viewed after saving.
          </p>
        </Card>

        {keys.length === 0 ? (
          <EmptyState
            message="No API keys added yet."
            subMessage="Add one above to unlock unlimited reviews."
            icon={KeyRound}
          />
        ) : (
          <motion.div variants={listStagger} initial="hidden" animate="show" className="flex flex-col gap-3">
            <AnimatePresence mode="popLayout">
              {keys.map((key) => (
                <Card key={key.id} className="!p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                        <KeyRound size={15} strokeWidth={1.8} />
                      </div>
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-sm font-medium text-text-primary truncate">
                          {key.name}
                        </span>
                        <span className="text-xs font-mono text-text-tertiary tracking-widest truncate">
                          {key.maskedKey}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <span className="hidden sm:inline text-xs font-mono text-text-tertiary">
                        Added {new Date(key.createdAt).toLocaleDateString()}
                      </span>
                      <motion.button
                        onClick={() => onDelete(key.id)}
                        disabled={deletingId === key.id}
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-mono text-severity-high-text/80 hover:text-severity-high-text hover:bg-severity-high-bg transition-colors disabled:opacity-40"
                      >
                        <Trash2 size={13} strokeWidth={1.8} />
                        {deletingId === key.id ? 'Deleting…' : 'Delete'}
                      </motion.button>
                    </div>
                  </div>
                </Card>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </>
  )
}
