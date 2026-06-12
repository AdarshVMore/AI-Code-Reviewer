'use client'

import { Sidebar } from '@/components/layout/Sidebar'
import { TakeAction } from '@/components/layout/takeAction'
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
    <div className="flex h-screen overflow-hidden bg-bg-base">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
              <TakeAction message='Enter your API key and select model to get started' urlOnButton='/ai-usage' buttonLable='here' />
        
        {children}
      </main>
    </div>
  )
}
