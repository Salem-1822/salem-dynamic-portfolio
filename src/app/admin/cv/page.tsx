import { Suspense } from 'react'
import { prisma } from '@/lib/prisma'
import CVManager from './CVManager'
import { FileText } from 'lucide-react'

async function CVLoader() {
  const cvs = await prisma.cV.findMany({
    orderBy: [{ isActive: 'desc' }, { uploadedAt: 'desc' }],
    include: {
      admin: {
        select: {
          email: true,
        },
      },
    },
  })

  return (
    <div className="space-y-6">
      <div className="border-b border-neutral-800/80 pb-5">
        <div className="flex items-center gap-2.5">
          <FileText className="w-5 h-5 text-neutral-400" />
          <h1 className="text-xl md:text-2xl font-bold font-mono tracking-tight text-white uppercase">
            Curriculum Vitae Manager
          </h1>
        </div>
        <p className="text-xs font-mono text-neutral-400 mt-1">
          Upload PDF resumes to Cloudinary, activate the live version, preview, and manage archives
        </p>
      </div>

      <CVManager cvs={cvs} />
    </div>
  )
}

export default function CVAdminPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 font-mono text-xs text-neutral-500">
          Loading CV archive...
        </div>
      }
    >
      <CVLoader />
    </Suspense>
  )
}
