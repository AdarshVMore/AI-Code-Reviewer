'use client'

import { motion } from 'motion/react'
import { useRouter } from 'next/navigation'
import { Card, SectionLabel, EmptyState, TileWaveSkeletonPage } from '@/components/ui'
import { Topbar } from '@/components/layout/Topbar'
import { useRepos } from '@/hooks/useRepos'
import { FORCE_LOADING } from '@/lib/forceLoading'
import { GitBranch } from 'lucide-react'

const listStagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
}

export default function ReposPage() {
  const { repos, loading, error } = useRepos()
  const router = useRouter()

  if (FORCE_LOADING || loading) {
    return (
      <>
        <Topbar title="Repos" />
        <TileWaveSkeletonPage layout="repos" />
      </>
    )
  }
  if (error) return <div className="px-8 py-7 text-sm text-text-secondary">{error}</div>

  return (
    <>
      <Topbar title="Repos" subtitle={`${repos.length} connected`} />
      <div className="px-8 py-7 w-full">
        <SectionLabel>Connected repositories</SectionLabel>
        {repos.length === 0 && (
          <EmptyState
            message="No repositories connected yet."
            subMessage="Install the GitHub App on a repo to get started."
            icon={GitBranch}
          />
        )}
        <motion.div variants={listStagger} initial="hidden" animate="show">
          {repos.map((repo) => (
            <Card
              key={repo.id}
              hoverable
              className="mb-3 p-4"
              onClick={() => router.push(`/repo/${repo.owner}/${repo.name}`)}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-bg-raised border border-border-hairline shrink-0">
                    <GitBranch size={14} strokeWidth={1.8} className="text-brand" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-primary font-mono truncate">{repo.owner}/{repo.name}</p>
                    <p className="text-xs text-text-tertiary mt-0.5">Connected {new Date(repo.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className="text-xs font-mono text-text-secondary shrink-0">{repo._count.reviews} reviews</span>
              </div>
            </Card>
          ))}
        </motion.div>
      </div>
    </>
  )
}
