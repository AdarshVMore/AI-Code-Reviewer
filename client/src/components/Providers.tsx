'use client'

import { SessionProvider } from 'next-auth/react'
import { ServerWakeGate } from '@/components/ServerWakeGate'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ServerWakeGate>{children}</ServerWakeGate>
    </SessionProvider>
  )
}
