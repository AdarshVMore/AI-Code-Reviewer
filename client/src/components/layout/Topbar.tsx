import { ReactNode } from 'react'

interface TopbarProps {
  title: string
  subtitle?: string
  right?: ReactNode
}

export function Topbar({ title, subtitle, right }: TopbarProps) {
  return (
    <div className="h-14 border-b border-border-hairline px-6 flex items-center justify-between bg-bg-surface/40 backdrop-blur-xl sticky top-0 z-20 shrink-0">
      <div className="flex items-center">
        <span className="text-base font-medium text-text-primary tracking-tight">{title}</span>
        {subtitle && <span className="text-xs font-mono text-text-secondary ml-3">{subtitle}</span>}
      </div>
      {right && <div className="flex items-center gap-3">{right}</div>}
    </div>
  )
}
