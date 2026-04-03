export type Plan = 'free' | 'pro' | 'team'

export type Severity = 'high' | 'medium' | 'low'

export type RepoStatus = 'active' | 'paused'

export type DeploymentStatus = 'success' | 'failed' | 'building'

export interface User {
  id: string
  githubUsername: string
  githubAvatar: string
  email: string
  plan: Plan
}

export interface Repo {
  id: string
  owner: string
  name: string
  fullName: string
  status: RepoStatus
  reviewCount: number
  lastReviewAt: string | null
  installationId: number
}

export interface ReviewIssue {
  file: string
  line: number
  severity: Severity
  category: string
  message: string
  suggestion: string
}

export interface Review {
  id: string
  prNumber: number
  prTitle: string
  repoFullName: string
  author: string
  authorAvatar: string
  severity: Severity
  issueCount: number
  highCount: number
  mediumCount: number
  lowCount: number
  summary: string
  issues: ReviewIssue[]
  tokensUsed: number
  reviewedAt: string
}

export interface Collaborator {
  id: string
  githubUsername: string
  githubAvatar: string
  prCount: number
  issueCount: number
  highSeverityCount: number
  topIssueCategory: string
}

export interface DashboardStats {
  prsReviewedThisMonth: number
  prsReviewedDelta: number
  issuesFound: number
  highSeverityCount: number
  avgReviewTimeSeconds: number
  avgReviewTimeDelta: number
  tokensUsed: number
  tokenLimit: number
}

export interface RepoStats {
  totalReviews: number
  totalIssues: number
  avgIssuesPerPR: number
  issuesByCategory: { category: string; count: number }[]
  reviewsOverTime: { date: string; count: number }[]
}

export interface RepoSettings {
  strictness: 'strict' | 'balanced' | 'light'
  focusAreas: string[]
  ignorePaths: string[]
}
