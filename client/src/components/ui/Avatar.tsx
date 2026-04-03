const sizes = {
  sm: 'w-6 h-6 text-[10px]',
  md: 'w-8 h-8 text-xs',
  lg: 'w-10 h-10 text-sm',
}

interface AvatarProps {
  src?: string
  username: string
  size?: 'sm' | 'md' | 'lg'
}

export function Avatar({ src, username, size = 'md' }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={username}
        className={`${sizes[size]} rounded-full object-cover`}
      />
    )
  }
  return (
    <div className={`${sizes[size]} rounded-full bg-bg-raised text-text-secondary flex items-center justify-center font-medium`}>
      {username.charAt(0).toUpperCase()}
    </div>
  )
}
