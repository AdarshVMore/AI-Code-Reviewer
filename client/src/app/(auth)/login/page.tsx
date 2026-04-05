'use client'
import { signIn } from "next-auth/react";


export default function LoginPage() {
  
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

        <button
          onClick={() => signIn("github")}
          className="w-full flex items-center justify-center gap-2.5 bg-bg-raised hover:bg-[#222222] border border-bg-border text-text-primary text-sm font-medium rounded-xl py-2.5 px-4 transition-colors duration-150 active:scale-95"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
            <path fillRule="evenodd" clipRule="evenodd" d="M9 0C4.03 0 0 4.03 0 9c0 3.98 2.58 7.35 6.16 8.54.45.08.61-.2.61-.43v-1.5c-2.5.54-3.03-1.2-3.03-1.2-.41-1.04-1-1.32-1-1.32-.82-.56.06-.55.06-.55.9.06 1.38.93 1.38.93.8 1.37 2.1.97 2.61.74.08-.58.31-.97.57-1.19-2-.23-4.09-.99-4.09-4.43 0-.98.35-1.78.93-2.41-.09-.23-.4-1.14.09-2.37 0 0 .76-.24 2.48.93A8.6 8.6 0 0 1 9 4.36c.77 0 1.54.1 2.26.3 1.72-1.17 2.48-.93 2.48-.93.49 1.23.18 2.14.09 2.37.58.63.93 1.43.93 2.41 0 3.45-2.1 4.2-4.1 4.42.32.28.61.83.61 1.67v2.47c0 .24.16.52.62.43A9.01 9.01 0 0 0 18 9c0-4.97-4.03-9-9-9z" />
          </svg>
          Continue with GitHub
        </button>

        <p className="mt-4 text-xs text-text-tertiary text-center leading-relaxed">
          By continuing, you agree to share your GitHub repository access with ReviewPilot.
        </p>

      </div>
    </div>
  )
}
