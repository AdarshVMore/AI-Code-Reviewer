import { cn } from '@/lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      role="presentation"
      className={cn('skeleton-shimmer rounded-lg', className)}
    />
  )
}
