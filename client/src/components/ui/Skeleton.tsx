import { cn } from '@/lib/utils'

/** Classic shimmer skeleton — shiny flash sweeping left → right */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      role="presentation"
      className={cn('skeleton-shimmer rounded-lg', className)}
    />
  )
}
