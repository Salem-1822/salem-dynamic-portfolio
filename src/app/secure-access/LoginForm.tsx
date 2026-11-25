'use client'

import { useActionState } from 'react'
import { loginAction } from './actions'

export default function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, null)

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && (
        <div className="p-3 text-xs font-mono rounded bg-red-950/60 border border-red-900/80 text-red-300">
          {state.error}
        </div>
      )}

      <div>
        <label
          htmlFor="email"
          className="block text-xs font-mono tracking-wider uppercase text-neutral-400 mb-2"
        >
          Identifier
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="admin@domain.com"
          disabled={isPending}
          className="w-full px-3.5 py-2.5 text-sm bg-neutral-900/90 border border-neutral-800 rounded text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 disabled:opacity-50 transition"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-xs font-mono tracking-wider uppercase text-neutral-400 mb-2"
        >
          Secret Key
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••••••"
          disabled={isPending}
          className="w-full px-3.5 py-2.5 text-sm bg-neutral-900/90 border border-neutral-800 rounded text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 disabled:opacity-50 transition"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-2.5 px-4 text-xs font-mono uppercase tracking-widest font-semibold rounded bg-neutral-100 text-neutral-950 hover:bg-neutral-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-950 focus:ring-neutral-400 disabled:opacity-50 transition duration-150 flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
      >
        {isPending ? (
          <span className="flex items-center gap-2">
            <svg
              className="animate-spin h-3.5 w-3.5 text-neutral-950"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              ></path>
            </svg>
            Validating...
          </span>
        ) : (
          'Authenticate'
        )}
      </button>
    </form>
  )
}
