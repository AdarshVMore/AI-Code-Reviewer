import { motion } from 'motion/react'
import { LucideIcon, Inbox } from 'lucide-react'

interface EmptyStateProps {
  message: string
  subMessage?: string
  icon?: LucideIcon
}

export function EmptyState({ message, subMessage, icon: Icon = Inbox }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-bg-raised border border-border-hairline mb-3">
        <Icon size={16} strokeWidth={1.6} className="text-text-tertiary" />
      </div>
      <p className="text-sm text-text-secondary">{message}</p>
      {subMessage && <p className="text-xs text-text-tertiary mt-1">{subMessage}</p>}
    </motion.div>
  )
}
