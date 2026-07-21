'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useParams, useSearchParams } from 'next/navigation'
import { ChevronDown, CheckCircle2, AlertTriangle, AlertOctagon, ArrowLeft } from 'lucide-react'
import { Card, SectionLabel, LivePulse, TileWaveSkeletonPage } from '@/components/ui'
import { Topbar } from '@/components/layout/Topbar'
import { usePRReview } from '@/hooks/usePRReview'
import { useRepos } from '@/hooks'
import { applyIssueFix } from '@/lib/api/issues'
import { FORCE_LOADING } from '@/lib/forceLoading'
import type { PRIssue, Severity, IssueCategory } from '@/types'

const severityMeta: Record<Severity, { text: string; bg: string; border: string; icon: typeof AlertOctagon }> = {
  high: { text: 'text-severity-high-text', bg: 'bg-severity-high-bg', border: 'border-severity-high/25', icon: AlertOctagon },
  medium: { text: 'text-severity-med-text', bg: 'bg-severity-med-bg', border: 'border-severity-med/25', icon: AlertTriangle },
  low: { text: 'text-severity-low-text', bg: 'bg-severity-low-bg', border: 'border-severity-low/25', icon: CheckCircle2 },
}

const categoryStyles: Record<IssueCategory, string> = {
  security: 'text-text-secondary border border-border-hairline',
  performance: 'text-text-secondary border border-border-hairline',
  quality: 'text-text-secondary border border-border-hairline',
  maintainability: 'text-text-secondary border border-border-hairline',
}

function scoreColor(score: number | null) {
  if (score === null) return 'text-text-secondary'
  if (score >= 70) return 'text-severity-low'
  if (score >= 40) return 'text-severity-med'
  return 'text-severity-high'
}

function IssueCard({
  issue,
  highlighted,
  onFixed,
}: {
  issue: PRIssue
  highlighted: boolean
  onFixed: (issueId: string, commitSha: string | null) => void
}) {
  const [applying, setApplying] = useState(false)
  const [applyError, setApplyError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (highlighted) {
      setExpanded(true)
      cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [highlighted])

  async function handleApply() {
    setApplying(true)
    setApplyError(null)
    try {
      const result = await applyIssueFix(issue.id)
      onFixed(issue.id, result.commitSha ?? null)
    } catch {
      setApplyError('Could not apply this fix. Try again in a bit.')
    } finally {
      setApplying(false)
    }
  }

  const isApplied = issue.status === 'applied'
  const meta = severityMeta[issue.severity]
  const Icon = meta.icon

  return (
    <Card ref={cardRef} className={`mb-3 !p-0 overflow-hidden ${highlighted ? 'ring-2 ring-brand' : ''}`}>
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left cursor-pointer"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`flex items-center justify-center w-7 h-7 rounded-lg shrink-0 border ${meta.bg} ${meta.border}`}>
            <Icon size={13} strokeWidth={2} className={meta.text} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">{issue.problem}</p>
            <span className="font-mono text-xs text-text-tertiary">{issue.file}:{issue.line}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-xs font-mono px-2 py-0.5 rounded-full capitalize ${categoryStyles[issue.category]}`}>
            {issue.category}
          </span>
          {isApplied && <span className="text-xs font-mono text-severity-low">fixed</span>}
          <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.18 }}>
            <ChevronDown size={15} className="text-text-tertiary" />
          </motion.span>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="px-4 pb-4 pt-1 border-t border-border-hairline">
              <p className="text-xs font-mono text-text-tertiary mb-1 mt-3">Suggested fix</p>
              <p className="text-sm text-text-secondary leading-relaxed">{issue.fix}</p>

              {issue.fix && (
                <div className="mt-3 pt-3 border-t border-border-hairline flex items-center gap-3">
                  {isApplied ? (
                    <span className="text-xs font-mono text-severity-low">
                      Fixed{issue.appliedCommitSha ? ` · ${issue.appliedCommitSha.slice(0, 7)}` : ''}
                    </span>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      onClick={handleApply}
                      disabled={applying}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg bg-brand hover:bg-brand-hover text-white transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {applying ? 'Applying…' : 'Apply Suggestion →'}
                    </motion.button>
                  )}
                  {applyError && <span className="text-xs text-severity-high-text">{applyError}</span>}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}

export default function PRPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const owner = params.owner as string
  const repo = params.repo as string
  const prNumber = params.prNumber as string
  const highlightedIssueId = searchParams.get('issue')

  const { repos } = useRepos()
  const currentRepo = repos.find((r) => r.owner === owner && r.name === repo)
  const repoId = currentRepo?.id ?? ''

  const { review, loading, error } = usePRReview(repoId, prNumber)
  const [issueOverrides, setIssueOverrides] = useState<Record<string, { status: 'applied'; appliedCommitSha: string | null }>>({})

  function handleFixed(issueId: string, commitSha: string | null) {
    setIssueOverrides((prev) => ({ ...prev, [issueId]: { status: 'applied', appliedCommitSha: commitSha } }))
  }

  if (FORCE_LOADING || loading) {
    return (
      <>
        <Topbar title={`PR #${prNumber}`} />
        <TileWaveSkeletonPage layout="pr" />
      </>
    )
  }
  if (error || !review) return <div className="px-8 py-7 text-sm text-text-secondary">{error ?? 'Review not found.'}</div>

  const issues = review.issues.map((issue: PRIssue) => ({
    ...issue,
    ...issueOverrides[issue.id],
  }))

  const highCount = issues.filter((i: PRIssue) => i.severity === 'high').length
  const mediumCount = issues.filter((i: PRIssue) => i.severity === 'medium').length
  const lowCount = issues.filter((i: PRIssue) => i.severity === 'low').length
  const allClear = highCount === 0 && issues.length > 0

  return (
    <>
      <Topbar title={`PR #${review.prNumber}`} right={allClear ? <LivePulse label="Looks clean" tone="active" /> : undefined} />
      <div className="px-8 py-7 w-full">
        <Link
          href={`/repo/${owner}/${repo}`}
          className="inline-flex items-center gap-1.5 font-mono text-sm text-text-secondary hover:text-text-primary transition-colors duration-150"
        >
          <ArrowLeft size={13} /> {owner}/{repo}
        </Link>

        <div className="mt-5 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-semibold text-text-primary tracking-[-0.5px]">{review.prTitle ?? `PR #${review.prNumber}`}</h1>
            <div className="flex items-center gap-4 mt-2 flex-wrap">
              <span className="text-xs font-mono text-text-secondary">PR #{review.prNumber}</span>
              <span className="text-xs font-mono text-text-secondary">{new Date(review.createdAt).toLocaleDateString()}</span>
              <span className="text-xs font-mono text-text-secondary">by {review.author}</span>
            </div>
          </div>
          {review.score !== null && (
            <div className="flex flex-col items-end shrink-0">
              <span className={`text-3xl font-bold font-mono ${scoreColor(review.score)}`}>{review.score}</span>
              <span className="text-xs text-text-tertiary mt-0.5">score</span>
            </div>
          )}
        </div>

        {review.summary && (
          <Card className="mt-6 mb-6">
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1">
                <SectionLabel>Review summary</SectionLabel>
                <p className="text-sm text-text-secondary leading-relaxed mt-1">{review.summary}</p>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0 text-xs font-mono">
                {highCount > 0 && <span className="text-severity-high-text">{highCount} high</span>}
                {mediumCount > 0 && <span className="text-severity-med-text">{mediumCount} medium</span>}
                {lowCount > 0 && <span className="text-severity-low-text">{lowCount} low</span>}
              </div>
            </div>
          </Card>
        )}

        <SectionLabel>Issues found · {issues.length}</SectionLabel>
        {issues.length === 0 && <p className="text-sm text-text-secondary">No issues found. Nice PR. 🎉</p>}
        {issues.map((issue: PRIssue) => (
          <IssueCard
            key={issue.id}
            issue={issue}
            highlighted={issue.id === highlightedIssueId}
            onFixed={handleFixed}
          />
        ))}
      </div>
    </>
  )
}
