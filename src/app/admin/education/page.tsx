import { Suspense } from 'react'
import { prisma } from '@/lib/prisma'
import EducationManager from './EducationManager'
import { GraduationCap } from 'lucide-react'

async function EducationLoader() {
  const educations = await prisma.education.findMany({
    orderBy: [{ displayOrder: 'asc' }, { startDate: 'desc' }],
  })

  return (
    <div className="space-y-6">
      <div className="border-b border-neutral-800/80 pb-5">
        <div className="flex items-center gap-2.5">
          <GraduationCap className="w-5 h-5 text-neutral-400" />
          <h1 className="text-xl md:text-2xl font-bold font-mono tracking-tight text-white uppercase">
            Education Milestones
          </h1>
        </div>
        <p className="text-xs font-mono text-neutral-400 mt-1">
          Manage academic qualifications, degrees, and specialized diplomas
        </p>
      </div>

      <EducationManager educations={educations} />
    </div>
  )
}

export default function EducationPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 font-mono text-xs text-neutral-500">
          Loading education milestones...
        </div>
      }
    >
      <EducationLoader />
    </Suspense>
  )
}
