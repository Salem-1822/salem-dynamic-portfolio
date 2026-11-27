import { Suspense } from 'react'
import { prisma } from '@/lib/prisma'
import MessageInbox from './MessageInbox'
import { Mail } from 'lucide-react'

async function MessagesLoader() {
  const messages = await prisma.message.findMany({
    orderBy: { createdAt: 'desc' },
  })

  const unreadCount = messages.filter((m) => !m.isRead).length

  return (
    <div className="space-y-6">
      <div className="border-b border-neutral-800/80 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <Mail className="w-5 h-5 text-neutral-400" />
            <h1 className="text-xl md:text-2xl font-bold font-mono tracking-tight text-white uppercase">
              Contact Messages Inbox
            </h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-400 text-black">
                {unreadCount} NEW
              </span>
            )}
          </div>
          <p className="text-xs font-mono text-neutral-400 mt-1">
            Review incoming portfolio inquiries, manage read states, and respond directly
          </p>
        </div>
      </div>

      <MessageInbox messages={messages} />
    </div>
  )
}

export default function MessagesAdminPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 font-mono text-xs text-neutral-500">
          Loading message inbox...
        </div>
      }
    >
      <MessagesLoader />
    </Suspense>
  )
}
