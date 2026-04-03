interface EmptyStateProps {
  message: string
  subMessage?: string
}

export function EmptyState({ message, subMessage }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <p className="text-sm text-text-secondary">{message}</p>
      {subMessage && <p className="text-xs text-text-tertiary mt-1">{subMessage}</p>}
    </div>
  )
}
