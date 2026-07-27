import { ReactNode, forwardRef } from 'react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

interface CardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  hoverable?: boolean
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { children, className, onClick, hoverable },
  ref,
) {
  return (
    <motion.div
      ref={ref}
      onClick={onClick}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
      whileHover={hoverable ? { y: -2 } : undefined}
      className={cn(
        'glass-card rounded-xl p-5 relative z-10',
        hoverable && 'glass-card--hoverable cursor-pointer',
        className,
      )}
    >
      {children}
    </motion.div>
  )
})
