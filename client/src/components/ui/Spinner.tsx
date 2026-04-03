const sizes = {
  sm: 'w-4 h-4 border-2',
  lg: 'w-8 h-8 border-2',
}

export function Spinner({ size = 'sm' }: { size?: 'sm' | 'lg' }) {
  return (
    <div
      className={`${sizes[size]} rounded-full border-bg-muted border-t-brand animate-spin`}
    />
  )
}
