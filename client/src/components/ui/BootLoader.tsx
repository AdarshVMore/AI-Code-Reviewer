'use client'

export function BootLoader() {
  return (
    <div className="flex h-full min-h-[50vh] w-full items-center justify-center">
      <div className="flex items-center gap-2.5" role="status" aria-label="Loading">
        <div className="boot-loader-grid" aria-hidden>
          {Array.from({ length: 9 }, (_, i) => (
            <span
              key={i}
              className="boot-loader-cell"
              style={{ animationDelay: `${(i % 3) * 80 + Math.floor(i / 3) * 40}ms` }}
            />
          ))}
        </div>
        <span className="text-sm text-text-primary tracking-tight">Loading..</span>
      </div>
    </div>
  )
}
