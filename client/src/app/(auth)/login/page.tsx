import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { LoginButton } from "./LoginButton"

export default async function LoginPage() {
  const session = await getServerSession(authOptions)

  if (session?.accessToken) {
    redirect("/")
  }


  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center px-4">
      <div className="bg-bg-surface border border-bg-border rounded-2xl p-10 w-full max-w-sm">

        <div className="flex flex-col gap-1.5 mb-6">
          <span className="font-mono text-base font-medium text-brand">ReviewPilot</span>
          <h1 className="text-2xl font-semibold text-text-primary">Sign in to your account</h1>
          <p className="text-sm text-text-secondary leading-relaxed">
            Connect your GitHub to start reviewing PRs automatically.
          </p>
        </div>

        <LoginButton />

        <p className="mt-4 text-xs text-text-tertiary text-center leading-relaxed">
          By continuing, you agree to share your GitHub repository access with ReviewPilot.
        </p>

      </div>
    </div>
  )
}
