type BadgeVariant = 'high' | 'medium' | 'low' | 'active' | 'paused' | 'failed' | 'building' | 'success'

const styles: Record<BadgeVariant, string> = {
  high: 'bg-severity-high-bg text-severity-high-text border-severity-high/20',
  medium: 'bg-severity-med-bg text-severity-med-text border-severity-med/20',
  low: 'bg-severity-low-bg text-severity-low-text border-severity-low/20',
  active: 'bg-status-active-bg text-status-active border-status-active/20',
  paused: 'bg-status-paused-bg text-status-paused border-bg-border',
  failed: 'bg-status-failed-bg text-status-failed border-status-failed/20',
  building: 'bg-brand-muted text-brand border-brand/20',
  success: 'bg-severity-low-bg text-severity-low-text border-severity-low/20',
}

interface BadgeProps {
  variant: BadgeVariant
  label?: string
}

export function Badge({ variant, label }: BadgeProps) {
  const text = label ?? variant.charAt(0).toUpperCase() + variant.slice(1)
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium border ${styles[variant]}`}>
      {text}
    </span>
  )
}
