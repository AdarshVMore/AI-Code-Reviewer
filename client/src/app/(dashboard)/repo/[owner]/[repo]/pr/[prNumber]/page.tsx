'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Card, Badge, SectionLabel } from '@/components/ui'
import { Topbar } from '@/components/layout/Topbar'

const issues = [
  {
    file: 'src/auth/middleware.ts:47',
    severity: 'high' as const,
    category: 'Security',
    message: 'Missing token expiry validation',
    suggestion: 'Decode the JWT and verify the exp claim before continuing. An expired token currently passes validation without error.',
  },
  {
    file: 'src/auth/middleware.ts:83',
    severity: 'high' as const,
    category: 'Security',
    message: 'JWT secret falls back to undefined',
    suggestion: 'Validate process.env.JWT_SECRET at startup. If the env var is missing, jwt.verify uses undefined and accepts any token.',
  },
  {
    file: 'src/routes/user.ts:112',
    severity: 'high' as const,
    category: 'Error handling',
    message: 'Unhandled promise rejection on database query',
    suggestion: 'Wrap the Prisma call in try/catch. If the database is unreachable, this throws an unhandled rejection that crashes the worker process.',
  },
  {
    file: 'src/routes/user.ts:134',
    severity: 'medium' as const,
    category: 'Error handling',
    message: 'Missing 404 response when user not found',
    suggestion: "When findUnique returns null, the code continues and tries to access user.email. Add an early return: if (!user) return res.status(404).json({ error: 'User not found' })",
  },
  {
    file: 'src/auth/middleware.ts:29',
    severity: 'medium' as const,
    category: 'Code quality',
    message: "Magic string 'Bearer' repeated three times",
    suggestion: "Extract to a constant at the top of the file: const TOKEN_PREFIX = 'Bearer'",
  },
  {
    file: 'src/auth/middleware.ts:3',
    severity: 'low' as const,
    category: 'Code quality',
    message: 'Unused import: bcrypt',
    suggestion: 'bcrypt is imported but never referenced in this file. Remove the import to keep the module clean.',
  },
]

const deploymentLog = `Error: Cannot read properties of undefined (reading 'email')
    at Object.handler (/routes/user.ts:134:20)
    at processTicksAndRejections (node:internal/process/task_queues)
Deployment failed · acme/backend · commit 3f2a1c9 · 5 min ago`

const proposedFix = `// src/routes/user.ts:134
const user = await prisma.user.findUnique({ where: { id } })
if (!user) return res.status(404).json({ error: 'User not found' })
// now safe to access user.email`

export default function PRPage() {
  const params = useParams()
  const owner = params.owner as string
  const repo = params.repo as string

  return (
    <>
      <Topbar title={`PR #84`} />
      <div className="px-8 py-7 max-w-4xl mx-auto">

        <Link
          href={`/repo/${owner}/${repo}`}
          className="font-mono text-sm text-text-secondary hover:text-text-primary transition-colors duration-150"
        >
          ← {owner}/{repo}
        </Link>

        <div className="mt-5">
          <h1 className="text-xl font-semibold text-text-primary">Add JWT middleware to API routes</h1>
          <div className="flex items-center gap-4 mt-2 flex-wrap">
            <span className="text-xs font-mono text-text-secondary">PR #84</span>
            <span className="text-xs font-mono text-text-secondary">@adam</span>
            <span className="text-xs font-mono text-text-secondary">reviewed 2 min ago</span>
            <Link href="#" className="text-brand hover:underline text-xs font-mono">View on GitHub →</Link>
          </div>
        </div>

        <Card className="mt-6 mb-6">
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1">
              <SectionLabel>Review summary</SectionLabel>
              <p className="text-sm text-text-secondary leading-relaxed mt-1">
                This PR adds JWT authentication middleware to the Express API routes. The core
                logic is mostly correct but contains a critical security vulnerability in token
                validation and two unhandled error paths that could crash the server in production.
              </p>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <Badge variant="high" label="high severity" />
              <span className="text-xs font-mono text-text-tertiary">3 high · 2 medium · 1 low</span>
            </div>
          </div>
        </Card>

        <SectionLabel>Issues found · 6</SectionLabel>
        {issues.map((issue, i) => (
          <Card key={i} className="mb-3">
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <span className="font-mono text-xs text-brand">{issue.file}</span>
              <div className="flex items-center gap-2">
                <Badge variant={issue.severity} />
                <span className="text-xs bg-bg-muted text-text-tertiary px-2 py-0.5 rounded font-mono">
                  {issue.category}
                </span>
              </div>
            </div>
            <p className="text-sm font-medium text-text-primary">{issue.message}</p>
            <p className="text-sm text-text-secondary mt-1.5 leading-relaxed">{issue.suggestion}</p>
          </Card>
        ))}

        <div className="mt-8">
          <SectionLabel>Deployment status</SectionLabel>
          <Card>
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm text-text-primary">Production · Cloudflare Workers</span>
              <Badge variant="failed" />
            </div>
          </Card>
          <div className="mt-3 bg-bg-surface border border-bg-border rounded-xl p-4 overflow-x-auto">
            <pre className="font-mono text-xs text-text-secondary whitespace-pre leading-relaxed">{deploymentLog}</pre>
          </div>
        </div>

        <div className="mt-5">
          <SectionLabel>Proposed fix</SectionLabel>
          <p className="text-sm text-text-secondary mb-3">
            Claude identified the root cause and proposed the following change:
          </p>
          <div className="bg-bg-surface border border-bg-border rounded-xl p-4 overflow-x-auto">
            <pre className="font-mono text-xs text-[#86efac] whitespace-pre leading-relaxed">{proposedFix}</pre>
          </div>
        </div>

        <div className="mt-10 pt-5 border-t border-bg-border">
          <span className="text-xs font-mono text-text-tertiary">
            Reviewed using 4,821 tokens · claude-sonnet-4-5
          </span>
        </div>

      </div>
    </>
  )
}
