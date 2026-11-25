'use client'

import { useActionState } from 'react'
import { updateProfileAction } from './actions'
import { CheckCircle2, AlertCircle, Save, Loader2 } from 'lucide-react'
import type { Profile } from '@prisma/client'

interface ProfileFormProps {
  initialData: Profile | null
}

export default function ProfileForm({ initialData }: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState(updateProfileAction, null)

  return (
    <form action={formAction} className="space-y-6">
      {/* Feedback Alerts */}
      {state?.success && (
        <div className="p-4 rounded-md bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{state.message}</span>
        </div>
      )}

      {state?.error && (
        <div className="p-4 rounded-md bg-red-950/60 border border-red-800/80 text-red-300 text-xs font-mono flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
        <div>
          <label className="block text-neutral-400 uppercase tracking-wider mb-2">
            Full Name *
          </label>
          <input
            name="fullName"
            type="text"
            required
            defaultValue={initialData?.fullName || ''}
            disabled={isPending}
            className="w-full px-3.5 py-2.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
          />
        </div>

        <div>
          <label className="block text-neutral-400 uppercase tracking-wider mb-2">
            Professional Email *
          </label>
          <input
            name="email"
            type="email"
            required
            defaultValue={initialData?.email || ''}
            disabled={isPending}
            className="w-full px-3.5 py-2.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-neutral-400 uppercase tracking-wider mb-2">
            Headline *
          </label>
          <input
            name="headline"
            type="text"
            required
            defaultValue={initialData?.headline || ''}
            disabled={isPending}
            placeholder="e.g. Full-Stack Web Developer & Cybersecurity Enthusiast"
            className="w-full px-3.5 py-2.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-neutral-400 uppercase tracking-wider mb-2">
            Biography *
          </label>
          <textarea
            name="bio"
            rows={4}
            required
            defaultValue={initialData?.bio || ''}
            disabled={isPending}
            className="w-full px-3.5 py-2.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 leading-relaxed font-sans text-sm"
          />
        </div>

        <div>
          <label className="block text-neutral-400 uppercase tracking-wider mb-2">
            Location *
          </label>
          <input
            name="location"
            type="text"
            required
            defaultValue={initialData?.location || ''}
            disabled={isPending}
            placeholder="Marrakech, Morocco"
            className="w-full px-3.5 py-2.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
          />
        </div>

        <div>
          <label className="block text-neutral-400 uppercase tracking-wider mb-2">
            Phone Number
          </label>
          <input
            name="phone"
            type="text"
            defaultValue={initialData?.phone || ''}
            disabled={isPending}
            placeholder="+212 600-000000"
            className="w-full px-3.5 py-2.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
          />
        </div>

        <div>
          <label className="block text-neutral-400 uppercase tracking-wider mb-2">
            GitHub URL
          </label>
          <input
            name="githubUrl"
            type="url"
            defaultValue={initialData?.githubUrl || ''}
            disabled={isPending}
            placeholder="https://github.com/..."
            className="w-full px-3.5 py-2.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
          />
        </div>

        <div>
          <label className="block text-neutral-400 uppercase tracking-wider mb-2">
            LinkedIn URL
          </label>
          <input
            name="linkedinUrl"
            type="url"
            defaultValue={initialData?.linkedinUrl || ''}
            disabled={isPending}
            placeholder="https://linkedin.com/in/..."
            className="w-full px-3.5 py-2.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-neutral-400 uppercase tracking-wider mb-2">
            Avatar URL
          </label>
          <input
            name="avatarUrl"
            type="url"
            defaultValue={initialData?.avatarUrl || ''}
            disabled={isPending}
            placeholder="https://images.unsplash.com/... or GitHub avatar"
            className="w-full px-3.5 py-2.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
          />
        </div>
      </div>

      <div className="pt-4 border-t border-neutral-800 flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="px-5 py-2.5 rounded bg-white text-black font-mono text-xs font-semibold uppercase tracking-wider hover:bg-neutral-200 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isPending ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Saving Changes...</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              <span>Save Profile</span>
            </>
          )}
        </button>
      </div>
    </form>
  )
}
