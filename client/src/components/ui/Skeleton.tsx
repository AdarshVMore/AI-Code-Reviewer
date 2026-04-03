import { cn } from '@/lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('bg-bg-surface animate-pulse rounded-lg', className)} />
}
