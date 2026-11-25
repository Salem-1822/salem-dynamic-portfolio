import { Suspense } from 'react'
import { prisma } from '@/lib/prisma'
import SkillManager from './SkillManager'
import { Cpu } from 'lucide-react'

async function SkillsLoader() {
  const skills = await prisma.skill.findMany({
    orderBy: [{ category: 'asc' }, { displayOrder: 'asc' }],
  })

  return (
    <div className="space-y-6">
      <div className="border-b border-neutral-800/80 pb-5">
        <div className="flex items-center gap-2.5">
          <Cpu className="w-5 h-5 text-neutral-400" />
          <h1 className="text-xl md:text-2xl font-bold font-mono tracking-tight text-white uppercase">
            Skills Management
          </h1>
        </div>
        <p className="text-xs font-mono text-neutral-400 mt-1">
          Catalog, categorize, and organize your technical capabilities and proficiencies
        </p>
      </div>

      <SkillManager skills={skills} />
    </div>
  )
}

export default function SkillsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 font-mono text-xs text-neutral-500">
          Loading skills telemetry...
        </div>
      }
    >
      <SkillsLoader />
    </Suspense>
  )
}
