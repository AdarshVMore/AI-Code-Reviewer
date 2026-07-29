'use client'

import { useEffect, useState } from 'react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
const HEALTH_URL = `${API_BASE}/health`
const POLL_INTERVAL_MS = 3000
const SHOW_LOADER_AFTER_MS = 500
const SLOW_HINT_AFTER_MS = 8000

export function ServerWakeGate({ children }: { children: React.ReactNode }) {
  const [awake, setAwake] = useState(false)
  const [showLoader, setShowLoader] = useState(false)
  const [slow, setSlow] = useState(false)

  useEffect(() => {
    if (awake) return

    let cancelled = false
    const showTimer = setTimeout(() => { if (!cancelled) setShowLoader(true) }, SHOW_LOADER_AFTER_MS)
    const slowTimer = setTimeout(() => { if (!cancelled) setSlow(true) }, SLOW_HINT_AFTER_MS)

    const ping = async () => {
      try {
        const res = await fetch(HEALTH_URL, { cache: 'no-store' })
        if (res.ok && !cancelled) setAwake(true)
      } catch {
        // server asleep or still starting up — keep polling
      }
    }

    ping()
    const interval = setInterval(ping, POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      clearTimeout(showTimer)
      clearTimeout(slowTimer)
      clearInterval(interval)
    }
  }, [awake])

  if (awake) return <>{children}</>
  if (!showLoader) return null

  return <ServerWakeLoader slow={slow} />
}

function ServerWakeLoader({ slow }: { slow: boolean }) {
  return (
    <div className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-bg-base">
      <div className="ambient-glow-layer" aria-hidden>
        <div
          className="ambient-blob ambient-blob--brand ambient-blob--a"
          style={{ width: 480, height: 480, top: '20%', left: '30%' }}
        />
        <div
          className="ambient-blob ambient-blob--pulse ambient-blob--b"
          style={{ width: 360, height: 360, bottom: '15%', right: '25%' }}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-4 px-6 text-center">
        <div className="flex items-center gap-2.5" role="status" aria-label="Waking up server">
          <div className="boot-loader-grid" aria-hidden>
            {Array.from({ length: 9 }, (_, i) => (
              <span
                key={i}
                className="boot-loader-cell"
                style={{ animationDelay: `${(i % 3) * 80 + Math.floor(i / 3) * 40}ms` }}
              />
            ))}
          </div>
          <span className="text-sm text-text-primary tracking-tight">Waking up the server…</span>
        </div>

        <p className="max-w-sm text-xs leading-relaxed text-text-secondary">
          {slow
            ? 'Still starting up — free-tier servers on Render take up to a minute after being idle. Almost there.'
            : "This app runs on Render's free tier, which spins down after 15 minutes of inactivity. First load can take a moment."}
        </p>
      </div>
    </div>
  )
}
