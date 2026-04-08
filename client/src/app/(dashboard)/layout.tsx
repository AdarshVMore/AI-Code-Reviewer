'use client'

import { Sidebar } from '@/components/layout/Sidebar'
import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import apiClient from '@/lib/api/client'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = useSession()

useEffect(() => {
  if (session.status === "authenticated") {
    apiClient.get("/api/user/me") 
  }
}, [session.status])

  return (
    <div className="flex h-screen overflow-hidden bg-bg-base">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
