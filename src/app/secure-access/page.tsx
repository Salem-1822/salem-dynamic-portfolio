import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getCurrentAdmin } from '@/lib/auth'
import LoginForm from './LoginForm'

export const metadata = {
  title: 'Authentication Gateway',
  robots: {
    index: false,
    follow: false,
  },
}

async function SecureAccessContent() {
  const currentAdmin = await getCurrentAdmin()
  if (currentAdmin) {
    redirect('/admin')
  }

  return (
    <div className="w-full max-w-sm border border-neutral-800/80 bg-neutral-950/90 rounded-lg p-8 shadow-2xl backdrop-blur-sm">
      <div className="mb-6 text-center">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-neutral-800 bg-neutral-900 mb-3 text-neutral-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <h1 className="text-sm font-mono font-medium tracking-wider text-neutral-200 uppercase">
          Restricted Entry
        </h1>
        <p className="text-xs font-mono text-neutral-500 mt-1">
          Access attempts are logged and monitored.
        </p>
      </div>

      <LoginForm />

      <div className="mt-8 pt-4 border-t border-neutral-900 text-center">
        <p className="text-[10px] font-mono text-neutral-600 uppercase tracking-widest">
          Cryptographic Integrity Active
        </p>
      </div>
    </div>
  )
}

export default function SecureAccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white px-4 selection:bg-neutral-800 selection:text-white">
      <Suspense
        fallback={
          <div className="p-8 font-mono text-xs text-neutral-500 border border-neutral-800/60 rounded bg-neutral-950">
            Initializing secure perimeter...
          </div>
        }
      >
        <SecureAccessContent />
      </Suspense>
    </div>
  )
}
