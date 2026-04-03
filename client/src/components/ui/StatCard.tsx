import { Card } from './Card'

interface StatCardProps {
  label: string
  value: string | number
  trend?: string
  trendDirection?: 'up' | 'down' | 'neutral'
}

const trendColors = {
  up: 'text-severity-low',
  down: 'text-severity-high',
  neutral: 'text-text-tertiary',
}

export function StatCard({ label, value, trend, trendDirection = 'neutral' }: StatCardProps) {
  return (
    <Card>
      <div className="text-3xl font-semibold text-text-primary">{value}</div>
      <div className="text-xs text-text-secondary mt-1">{label}</div>
      {trend && (
        <div className={`text-xs mt-3 ${trendColors[trendDirection]}`}>{trend}</div>
      )}
    </Card>
  )
}
