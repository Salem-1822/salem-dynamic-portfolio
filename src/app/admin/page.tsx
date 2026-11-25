import { Suspense } from 'react'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import {
  FolderGit2,
  Cpu,
  Mail,
  FileCheck,
  ShieldAlert,
  ArrowUpRight,
  Clock,
} from 'lucide-react'

async function DashboardMetrics() {
  const [
    totalProjects,
    totalSkills,
    unreadMessages,
    activeCV,
    recentLogs,
  ] = await Promise.all([
    prisma.project.count(),
    prisma.skill.count(),
    prisma.message.count({ where: { isRead: false } }),
    prisma.cV.findFirst({ where: { isActive: true } }),
    prisma.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        admin: {
          select: { email: true },
        },
      },
    }),
  ])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-neutral-800/80 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold font-mono tracking-tight text-white">
            SYSTEM OVERVIEW
          </h1>
          <p className="text-xs font-mono text-neutral-400 mt-1">
            Real-time telemetry and management controls
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs text-neutral-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Database Online & Synchronized</span>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        <div className="p-5 rounded-lg border border-neutral-800 bg-neutral-900/60 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 mb-3">
            <span className="text-xs uppercase tracking-wider">Total Projects</span>
            <FolderGit2 className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white">{totalProjects}</span>
            <Link
              href="/admin/projects"
              className="text-[11px] text-neutral-400 hover:text-white flex items-center gap-0.5"
            >
              Manage <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        <div className="p-5 rounded-lg border border-neutral-800 bg-neutral-900/60 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 mb-3">
            <span className="text-xs uppercase tracking-wider">Technical Skills</span>
            <Cpu className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white">{totalSkills}</span>
            <Link
              href="/admin/skills"
              className="text-[11px] text-neutral-400 hover:text-white flex items-center gap-0.5"
            >
              Manage <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        <div className="p-5 rounded-lg border border-neutral-800 bg-neutral-900/60 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 mb-3">
            <span className="text-xs uppercase tracking-wider">Unread Inquiries</span>
            <Mail className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className={`text-2xl font-bold ${unreadMessages > 0 ? 'text-amber-400' : 'text-white'}`}>
              {unreadMessages}
            </span>
            <Link
              href="/admin/messages"
              className="text-[11px] text-neutral-400 hover:text-white flex items-center gap-0.5"
            >
              View <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        <div className="p-5 rounded-lg border border-neutral-800 bg-neutral-900/60 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 mb-3">
            <span className="text-xs uppercase tracking-wider">Active CV</span>
            <FileCheck className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-medium text-emerald-400 truncate max-w-[130px]" title={activeCV?.fileName || 'No active CV'}>
              {activeCV ? activeCV.fileName : 'No active CV'}
            </span>
            <Link
              href="/admin/cv"
              className="text-[11px] text-neutral-400 hover:text-white flex items-center gap-0.5"
            >
              Update <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="rounded-lg border border-neutral-800/80 bg-neutral-900/40 overflow-hidden font-mono">
        <div className="p-5 border-b border-neutral-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-neutral-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-200">
              Audit Event Log (Last 10 Events)
            </h2>
          </div>
          <span className="text-[10px] text-neutral-500 uppercase tracking-widest">
            Cryptographic Integrity Active
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-950/80 text-neutral-400 text-[10px] uppercase tracking-wider border-b border-neutral-800/80">
              <tr>
                <th className="px-5 py-3 font-semibold">Action</th>
                <th className="px-5 py-3 font-semibold">Entity Type</th>
                <th className="px-5 py-3 font-semibold">Entity ID</th>
                <th className="px-5 py-3 font-semibold">Initiator</th>
                <th className="px-5 py-3 font-semibold">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
              {recentLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-6 text-center text-neutral-600">
                    No audit records logged yet.
                  </td>
                </tr>
              ) : (
                recentLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-neutral-900/40 transition-colors">
                    <td className="px-5 py-3 font-semibold text-neutral-200">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-neutral-800 border border-neutral-700/60 text-neutral-300">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-neutral-400">{log.entityType}</td>
                    <td className="px-5 py-3 text-neutral-500 text-[11px]">
                      {log.entityId ? log.entityId.slice(0, 12) + '...' : '—'}
                    </td>
                    <td className="px-5 py-3 text-neutral-400 text-[11px]">
                      {log.admin?.email ?? 'System'}
                    </td>
                    <td className="px-5 py-3 text-neutral-500 text-[11px] whitespace-nowrap flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-neutral-600" />
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default function AdminDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 font-mono text-xs text-neutral-500 flex items-center justify-center">
          Loading system telemetry...
        </div>
      }
    >
      <DashboardMetrics />
    </Suspense>
  )
}
