import { ReactNode } from 'react'

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs font-medium text-text-tertiary uppercase tracking-widest mb-3">
      {children}
    </p>
  )
}
