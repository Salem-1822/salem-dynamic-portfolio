import { Suspense } from 'react'
import { prisma } from '@/lib/prisma'
import ExperienceManager from './ExperienceManager'
import { Briefcase } from 'lucide-react'

async function ExperienceLoader() {
  const [experiences, allSkills] = await Promise.all([
    prisma.experience.findMany({
      include: {
        skills: {
          include: {
            skill: true,
          },
        },
      },
      orderBy: [{ displayOrder: 'asc' }, { startDate: 'desc' }],
    }),
    prisma.skill.findMany({
      orderBy: { name: 'asc' },
    }),
  ])

  return (
    <div className="space-y-6">
      <div className="border-b border-neutral-800/80 pb-5">
        <div className="flex items-center gap-2.5">
          <Briefcase className="w-5 h-5 text-neutral-400" />
          <h1 className="text-xl md:text-2xl font-bold font-mono tracking-tight text-white uppercase">
            Professional Experience
          </h1>
        </div>
        <p className="text-xs font-mono text-neutral-400 mt-1">
          Manage career history, employment engagements, and associated technical proficiencies
        </p>
      </div>

      <ExperienceManager experiences={experiences} allSkills={allSkills} />
    </div>
  )
}

export default function ExperiencePage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 font-mono text-xs text-neutral-500">
          Loading professional experience records...
        </div>
      }
    >
      <ExperienceLoader />
    </Suspense>
  )
}
