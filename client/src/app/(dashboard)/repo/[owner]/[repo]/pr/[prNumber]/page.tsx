'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Card, Badge, SectionLabel, Spinner } from '@/components/ui'
import { Topbar } from '@/components/layout/Topbar'
import { usePRReview } from '@/hooks/usePRReview'
import { useRepos } from '@/hooks'
import type { PRIssue, Severity, IssueCategory } from '@/types'

const severityStyles: Record<Severity, string> = {
  high: ' text-white border border-white/20',
  medium: ' text-white border border-white/20',
  low: ' text-white border border-white/20',
}

const categoryStyles: Record<IssueCategory, string> = {
  security: 'text-white border border-white/20',
  performance: 'text-white border border-white/20',
  quality: 'text-white border border-white/20',
  maintainability: 'text-white border border-white/20',
}

function scoreColor(score: number | null) {
  if (score === null) return 'text-text-secondary'
  if (score >= 70) return 'text-green-300'
  if (score >= 40) return 'text-amber-300'
  return 'text-red-300'
}

function IssueCard({ issue }: { issue: PRIssue }) {
  return (
    <Card className="mb-3">
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <span className="font-mono text-xs text-brand">{issue.file}:{issue.line}</span>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-mono px-2 py-0.5 rounded-full capitalize ${categoryStyles[issue.category]}`}>
            {issue.category}
          </span>
          <span className={`text-xs font-mono px-2 py-0.5 rounded-full capitalize ${severityStyles[issue.severity]}`}>
            {issue.severity}
          </span>
        </div>
      </div>
      <p className="text-sm font-medium text-text-primary">{issue.problem}</p>
      <div className="mt-3 pt-3 border-t border-border">
        <p className="text-xs font-mono text-text-tertiary mb-1">Suggested fix</p>
        <p className="text-sm text-text-secondary leading-relaxed">{issue.fix}</p>
      </div>
    </Card>
  )
}

export default function PRPage() {
  const params = useParams()
  const owner = params.owner as string
  const repo = params.repo as string
  const prNumber = params.prNumber as string

  const { repos } = useRepos()
  const currentRepo = repos.find((r) => r.owner === owner && r.name === repo)
  const repoId = currentRepo?.id ?? ''

  const { review, loading, error } = usePRReview(repoId, prNumber)

  if (loading) return <div className="flex items-center justify-center h-full"><Spinner /></div>
  if (error || !review) return <div className="px-8 py-7 text-sm text-text-secondary">{error ?? 'Review not found.'}</div>

  const highCount = review.issues.filter((i: PRIssue) => i.severity === 'high').length
  const mediumCount = review.issues.filter((i: PRIssue) => i.severity === 'medium').length
  const lowCount = review.issues.filter((i: PRIssue) => i.severity === 'low').length

  return (
    <>
      <Topbar title={`PR #${review.prNumber}`} />
      <div className="px-8 py-7 max-w-4xl mx-auto">

        <Link
          href={`/repo/${owner}/${repo}`}
          className="font-mono text-sm text-text-secondary hover:text-text-primary transition-colors duration-150"
        >
          ← {owner}/{repo}
        </Link>

        <div className="mt-5 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-semibold text-text-primary">{review.prTitle ?? `PR #${review.prNumber}`}</h1>
            <div className="flex items-center gap-4 mt-2 flex-wrap">
              <span className="text-xs font-mono text-text-secondary">PR #{review.prNumber}</span>
              <span className="text-xs font-mono text-text-secondary">{new Date(review.createdAt).toLocaleDateString()}</span>
              <span className='text-xs font-mono text-text-secondary'>by {review.author}</span>

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
                {highCount > 0 && <span className="text-white">{highCount} high</span>}
                {mediumCount > 0 && <span className="text-white">{mediumCount} medium</span>}
                {lowCount > 0 && <span className="text-white">{lowCount} low</span>}
              </div>
            </div>
          </Card>
        )}

        <SectionLabel>Issues found · {review.issues.length}</SectionLabel>
        {review.issues.length === 0 && <p className="text-sm text-text-secondary">No issues found.</p>}
        {review.issues.map((issue: PRIssue) => (
          <IssueCard key={issue.id} issue={issue} />
        ))}

      </div>
    </>
  )
}
