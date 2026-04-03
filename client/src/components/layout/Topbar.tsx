interface TopbarProps {
  title: string
  subtitle?: string
}

export function Topbar({ title, subtitle }: TopbarProps) {
  return (
    <div className="h-14 border-b border-bg-border px-6 flex items-center justify-between bg-bg-base shrink-0">
      <div className="flex items-center">
        <span className="text-base font-medium text-text-primary">{title}</span>
        {subtitle && <span className="text-xs font-mono text-text-secondary ml-3">{subtitle}</span>}
      </div>
    </div>
  )
}
