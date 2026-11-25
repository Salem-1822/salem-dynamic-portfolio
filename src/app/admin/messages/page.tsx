import { Mail } from 'lucide-react'

export default function MessagesAdminPage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-neutral-800/80 pb-5">
        <div className="flex items-center gap-2.5">
          <Mail className="w-5 h-5 text-neutral-400" />
          <h1 className="text-xl md:text-2xl font-bold font-mono tracking-tight text-white uppercase">
            Client Inquiries & Contact Telemetry
          </h1>
        </div>
        <p className="text-xs font-mono text-neutral-400 mt-1">
          Direct communication pipeline, inquiry statuses, and contact logs
        </p>
      </div>

      <div className="p-12 text-center border border-neutral-800/80 bg-neutral-900/30 rounded-lg font-mono text-xs space-y-2">
        <p className="text-neutral-300 font-semibold">Message Telemetry Pipeline Active</p>
        <p className="text-neutral-500">
          Public contact form capture and inbox triage queued for Phase 3.2.
        </p>
      </div>
    </div>
  )
}
