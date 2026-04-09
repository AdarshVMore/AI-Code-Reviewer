'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Card, Badge, SectionLabel, Spinner } from '@/components/ui'
import { Topbar } from '@/components/layout/Topbar'
import { usePRReview } from '@/hooks/usePRReview'
import { useRepos } from '@/hooks'

export default function PRPage() {
  const params = useParams()
  const owner = params.owner as string
  const repo = params.repo as string
  const prNumber = params.prNumber as string

    const { repos } = useRepos()
    const currentRepo = repos.find((r) => r.owner === owner && r.name === repo)
    const repoId = currentRepo?.id ?? ''

  const { review, loading, error } = usePRReview(repoId, prNumber)

  console.log

  if (loading) return <div className="flex items-center justify-center h-full"><Spinner /></div>
  if (error || !review) return <div className="px-8 py-7 text-sm text-text-secondary">{error ?? 'Review not found.'}</div>

  const issues = review.parsedReview?.issues ?? []
  console.log("issues =======>", issues)

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

        <div className="mt-5">
          <h1 className="text-xl font-semibold text-text-primary">{review.prTitle ?? `PR #${review.prNumber}`}</h1>
          <div className="flex items-center gap-4 mt-2 flex-wrap">
            <span className="text-xs font-mono text-text-secondary">PR #{review.prNumber}</span>
            <span className="text-xs font-mono text-text-secondary">{new Date(review.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {review.parsedReview?.summary && (
          <Card className="mt-6 mb-6">
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1">
                <SectionLabel>Review summary</SectionLabel>
                <p className="text-sm text-text-secondary leading-relaxed mt-1">{review.parsedReview.summary}</p>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className="text-xs font-mono text-text-tertiary">{issues.length} issues found</span>
              </div>
            </div>
          </Card>
        )}

        <SectionLabel>Issues found · {issues.length}</SectionLabel>
        {issues.length === 0 && <p className="text-sm text-text-secondary">No issues found.</p>}
        {issues.map((issue, i) => (
          <Card key={i} className="mb-3">
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <span className="font-mono text-xs text-brand">{issue.file}:{issue.line}</span>
            </div>
            <p className="text-sm font-medium text-text-primary">{issue.problem}</p>
            <p className="text-sm text-text-secondary mt-1.5 leading-relaxed">{issue.fix}</p>
          </Card>
        ))}

      </div>
    </>
  )
}
