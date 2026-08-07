interface LogoProps {
  size?: number
  className?: string
}

// mark: a focused node with two connected neighbors — echoes the code-graph feature
export function Logo({ size = 20, className }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <line x1="11" y1="19" x2="21" y2="9" stroke="currentColor" strokeOpacity="0.5" strokeWidth="2.6" strokeLinecap="round" />
      <line x1="11" y1="19" x2="23" y2="20" stroke="currentColor" strokeOpacity="0.5" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="21" cy="9" r="3.2" fill="currentColor" fillOpacity="0.55" />
      <circle cx="23" cy="20" r="3.2" fill="currentColor" fillOpacity="0.55" />
      <circle cx="11" cy="19" r="5.5" fill="currentColor" />
    </svg>
  )
}
