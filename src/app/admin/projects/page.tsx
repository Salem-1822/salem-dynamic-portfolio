import { Suspense } from 'react'
import { prisma } from '@/lib/prisma'
import ProjectManager from './ProjectManager'
import { FolderGit2 } from 'lucide-react'

async function ProjectsLoader() {
  const [projects, allSkills] = await Promise.all([
    prisma.project.findMany({
      include: {
        skills: {
          include: {
            skill: true,
          },
        },
      },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
    }),
    prisma.skill.findMany({
      orderBy: { name: 'asc' },
    }),
  ])

  return (
    <div className="space-y-6">
      <div className="border-b border-neutral-800/80 pb-5">
        <div className="flex items-center gap-2.5">
          <FolderGit2 className="w-5 h-5 text-neutral-400" />
          <h1 className="text-xl md:text-2xl font-bold font-mono tracking-tight text-white uppercase">
            Project Showcase Manager
          </h1>
        </div>
        <p className="text-xs font-mono text-neutral-400 mt-1">
          Curate portfolio builds, Cloudinary cover media, deployment links, and technical stacks
        </p>
      </div>

      <ProjectManager projects={projects} allSkills={allSkills} />
    </div>
  )
}

export default function ProjectsAdminPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 font-mono text-xs text-neutral-500">
          Loading project catalog...
        </div>
      }
    >
      <ProjectsLoader />
    </Suspense>
  )
}
