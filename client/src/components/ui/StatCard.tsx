import { Card } from './Card'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string | number
  trend?: string
  trendDirection?: 'up' | 'down' | 'neutral'
  className?: string
  compact?: boolean
}

const trendColors = {
  up: 'text-severity-low',
  down: 'text-severity-high',
  neutral: 'text-text-tertiary',
}

export function StatCard({
  label,
  value,
  trend,
  trendDirection = 'neutral',
  className,
  compact,
}: StatCardProps) {
  return (
    <Card className={cn(compact && '!p-3.5', className)}>
      <div
        className={cn(
          'font-semibold text-text-primary font-mono tracking-tight',
          compact ? 'text-2xl' : 'text-3xl',
        )}
      >
        {value}
      </div>
      <div className={cn('text-xs text-text-secondary tracking-[0.1px]', compact ? 'mt-1' : 'mt-1.5')}>
        {label}
      </div>
      {trend && (
        <div className={`text-xs mt-2 font-mono ${trendColors[trendDirection]}`}>{trend}</div>
      )}
    </Card>
  )
}
