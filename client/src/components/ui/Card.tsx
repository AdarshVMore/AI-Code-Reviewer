import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface CardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  hoverable?: boolean
}

export function Card({ children, className, onClick, hoverable }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-bg-surface border border-bg-border rounded-xl p-5',
        hoverable && 'cursor-pointer hover:bg-bg-raised transition-colors duration-150',
        className
      )}
    >
      {children}
    </div>
  )
}
