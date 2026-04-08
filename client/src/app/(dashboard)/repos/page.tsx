'use client'

import { useRouter } from 'next/navigation'
import { Card, SectionLabel, Spinner } from '@/components/ui'
import { Topbar } from '@/components/layout/Topbar'
import { useRepos } from '@/hooks/useRepos'

export default function ReposPage() {
  const { repos, loading, error } = useRepos()
  const router = useRouter()

  if (loading) return <div className="flex items-center justify-center h-full"><Spinner /></div>
  if (error) return <div className="px-8 py-7 text-sm text-text-secondary">{error}</div>

  return (
    <>
      <Topbar title="Repos" />
      <div className="px-8 py-7 max-w-7xl mx-auto">
        <SectionLabel>Connected repositories</SectionLabel>
        {repos.length === 0 && (
          <p className="text-sm text-text-secondary">No repositories connected yet. Install the GitHub App on a repo to get started.</p>
        )}
        {repos.map((repo) => (
          <Card
            key={repo.id}
            hoverable
            className="mb-3 p-4"
            onClick={() => router.push(`/repo/${repo.owner}/${repo.name}`)}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-text-primary font-mono">{repo.owner}/{repo.name}</p>
                <p className="text-xs text-text-tertiary mt-0.5">Connected {new Date(repo.createdAt).toLocaleDateString()}</p>
              </div>
              <span className="text-xs font-mono text-text-secondary shrink-0">{repo._count.reviews} reviews</span>
            </div>
          </Card>
        ))}
      </div>
    </>
  )
}
