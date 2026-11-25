import { FolderGit2 } from 'lucide-react'

export default function ProjectsAdminPage() {
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
          Portfolio project catalog and showcase deployments
        </p>
      </div>

      <div className="p-12 text-center border border-neutral-800/80 bg-neutral-900/30 rounded-lg font-mono text-xs space-y-2">
        <p className="text-neutral-300 font-semibold">Projects Module Active</p>
        <p className="text-neutral-500">
          Projects and Cloudinary showcase configuration is queued for Phase 3.2.
        </p>
      </div>
    </div>
  )
}
