import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn('text-xs font-medium text-text-tertiary uppercase tracking-widest mb-3', className)}>
      {children}
    </p>
  )
}
