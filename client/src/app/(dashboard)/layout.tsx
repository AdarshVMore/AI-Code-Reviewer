'use client'

import { Sidebar } from '@/components/layout/Sidebar'
import { TakeAction } from '@/components/layout/takeAction'
import { CommandPalette } from '@/components/layout/CommandPalette'
import { AmbientGlow } from '@/components/ui/AmbientGlow'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status])

  if (status === 'loading' || status === 'unauthenticated') return null

  return (
    <div className="flex h-screen overflow-hidden bg-bg-base relative">
      <AmbientGlow />
      <CommandPalette />
      <Sidebar />
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative z-10">
        <TakeAction
          message="Add your API key and pick a model to start reviewing."
          urlOnButton="/ai-usage"
          buttonLable="Set up AI"
        />

        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">
          {children}
        </div>
      </main>
    </div>
  )
}
