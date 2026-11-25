'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  User,
  FolderGit2,
  Cpu,
  Briefcase,
  GraduationCap,
  FileText,
  Mail,
  LogOut,
  Shield,
} from 'lucide-react'
import { adminLogoutAction } from './actions'

interface AdminSidebarProps {
  adminEmail: string
  adminRole: string
  adminId: string
}

const navItems = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Profile', href: '/admin/profile', icon: User },
  { label: 'Projects', href: '/admin/projects', icon: FolderGit2 },
  { label: 'Skills', href: '/admin/skills', icon: Cpu },
  { label: 'Experience', href: '/admin/experience', icon: Briefcase },
  { label: 'Education', href: '/admin/education', icon: GraduationCap },
  { label: 'CV Manager', href: '/admin/cv', icon: FileText },
  { label: 'Messages', href: '/admin/messages', icon: Mail },
]

export default function AdminSidebar({ adminEmail, adminRole }: AdminSidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="w-full md:w-64 bg-black border-r border-neutral-800/80 flex flex-col justify-between shrink-0">
      <div>
        {/* Brand / Security Badge */}
        <div className="p-6 border-b border-neutral-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-neutral-900 border border-neutral-700/80 flex items-center justify-center text-neutral-200">
              <Shield className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <span className="font-mono text-xs font-bold tracking-wider text-white uppercase block">
                CORE SYSTEM
              </span>
              <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest block">
                Admin Console
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive =
              item.href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-md text-xs font-mono transition-colors ${
                  isActive
                    ? 'bg-neutral-900 text-white font-medium border border-neutral-800'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-neutral-500'}`} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Admin Info & Logout Footer */}
      <div className="p-4 border-t border-neutral-800/80 bg-neutral-950/60 space-y-3">
        <div className="px-2 py-1">
          <p className="text-[11px] font-mono text-neutral-300 truncate" title={adminEmail}>
            {adminEmail}
          </p>
          <span className="inline-block mt-1 text-[9px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-neutral-400">
            {adminRole}
          </span>
        </div>

        <form action={adminLogoutAction}>
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-mono text-neutral-400 hover:text-red-400 hover:bg-neutral-900 rounded border border-neutral-800 hover:border-red-900/50 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </form>
      </div>
    </aside>
  )
}
