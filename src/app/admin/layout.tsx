import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getCurrentAdmin } from '@/lib/auth'
import AdminSidebar from './AdminSidebar'

export const metadata = {
  title: 'Admin Back Office',
  robots: {
    index: false,
    follow: false,
  },
}

async function AuthenticatedAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const admin = await getCurrentAdmin()

  // Stealth Security: If no active admin session, return 404 (not-found)
  if (!admin) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-black text-neutral-100 flex flex-col md:flex-row font-sans selection:bg-neutral-800 selection:text-white">
      <AdminSidebar
        adminEmail={admin.email}
        adminRole={admin.role}
        adminId={admin.id}
      />
      <main className="flex-1 min-w-0 bg-neutral-950/60 p-6 md:p-10 overflow-y-auto">
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  )
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black text-neutral-500 font-mono text-xs flex items-center justify-center">
          Verifying perimeter authorization...
        </div>
      }
    >
      <AuthenticatedAdminLayout>{children}</AuthenticatedAdminLayout>
    </Suspense>
  )
}
