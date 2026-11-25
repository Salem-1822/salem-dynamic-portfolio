import { Suspense } from 'react'
import { prisma } from '@/lib/prisma'
import ProfileForm from './ProfileForm'
import { UserCheck } from 'lucide-react'

async function ProfileLoader() {
  const profile = await prisma.profile.findFirst()

  return (
    <div className="space-y-6">
      <div className="border-b border-neutral-800/80 pb-5">
        <div className="flex items-center gap-2.5">
          <UserCheck className="w-5 h-5 text-neutral-400" />
          <h1 className="text-xl md:text-2xl font-bold font-mono tracking-tight text-white uppercase">
            Profile Configuration
          </h1>
        </div>
        <p className="text-xs font-mono text-neutral-400 mt-1">
          Manage your personal biography, contact coordinates, and social identities
        </p>
      </div>

      <div className="rounded-lg border border-neutral-800/80 bg-neutral-900/40 p-6 md:p-8">
        <ProfileForm initialData={profile} />
      </div>
    </div>
  )
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 font-mono text-xs text-neutral-500">
          Loading profile configuration...
        </div>
      }
    >
      <ProfileLoader />
    </Suspense>
  )
}
