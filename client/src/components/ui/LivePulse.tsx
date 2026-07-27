import { cn } from '@/lib/utils'

interface LivePulseProps {
  label: string
  tone?: 'pulse' | 'brand' | 'active'
  className?: string
}

const toneDot: Record<string, string> = {
  pulse: 'bg-pulse',
  brand: 'bg-brand',
  active: 'bg-status-active',
}

const toneText: Record<string, string> = {
  pulse: 'text-pulse',
  brand: 'text-brand',
  active: 'text-status-active',
}

export function LivePulse({ label, tone = 'pulse', className }: LivePulseProps) {
  return (
    <span className={cn('inline-flex items-center gap-2 text-xs font-mono', toneText[tone], className)}>
      <span className="relative flex h-2 w-2 items-center justify-center">
        <span className={cn('absolute inline-block h-2 w-2 rounded-full live-pulse-dot', toneDot[tone])} />
        <span className={cn('inline-block h-1 w-1 rounded-full', toneDot[tone])} />
      </span>
      {label}
    </span>
  )
}
