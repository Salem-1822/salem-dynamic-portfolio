'use client'

import { useState, useEffect, useActionState } from 'react'
import {
  toggleMessageReadAction,
  deleteMessageAction,
  type MessageActionResult,
} from './actions'
import {
  Mail,
  MailOpen,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Clock,
  Reply,
  Inbox,
  Loader2,
} from 'lucide-react'
import type { Message } from '@prisma/client'

interface MessageInboxProps {
  messages: Message[]
}

type FilterMode = 'ALL' | 'UNREAD' | 'READ'

export default function MessageInbox({ messages }: MessageInboxProps) {
  const [filter, setFilter] = useState<FilterMode>('ALL')
  const [selectedId, setSelectedId] = useState<string | null>(
    messages[0]?.id ?? null
  )
  const [banner, setBanner] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const [toggleState, toggleAction, isTogglePending] = useActionState(
    toggleMessageReadAction,
    null
  )
  const [deleteState, deleteAction, isDeletePending] = useActionState(
    deleteMessageAction,
    null
  )

  const applyFeedback = (state: MessageActionResult | null) => {
    if (!state) return
    if (state.success && state.message) {
      setBanner({ type: 'success', text: state.message })
      if (state.deletedId && state.deletedId === selectedId) {
        const remaining = messages.filter((m) => m.id !== state.deletedId)
        setSelectedId(remaining[0]?.id ?? null)
      }
    } else if (!state.success && state.error) {
      setBanner({ type: 'error', text: state.error })
    }
  }

  useEffect(() => {
    applyFeedback(toggleState)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toggleState])

  useEffect(() => {
    applyFeedback(deleteState)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deleteState])

  const unreadCount = messages.filter((m) => !m.isRead).length
  const readCount = messages.length - unreadCount

  const filteredMessages = messages.filter((m) => {
    if (filter === 'UNREAD') return !m.isRead
    if (filter === 'READ') return m.isRead
    return true
  })

  const selectedMessage =
    messages.find((m) => m.id === selectedId) ?? filteredMessages[0] ?? null

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Feedback Banner */}
      {banner && (
        <div
          className={`p-4 rounded-md flex items-center justify-between gap-2 border ${
            banner.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300'
              : 'bg-red-950/60 border-red-800/80 text-red-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {banner.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{banner.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setBanner(null)}
            className="text-neutral-400 hover:text-white cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Filter & Unread Telemetry Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          <button
            type="button"
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded transition cursor-pointer ${
              filter === 'ALL'
                ? 'bg-white text-black font-semibold'
                : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            ALL ({messages.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('UNREAD')}
            className={`px-3 py-1.5 rounded transition cursor-pointer flex items-center gap-1.5 ${
              filter === 'UNREAD'
                ? 'bg-white text-black font-semibold'
                : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            <span>UNREAD ({unreadCount})</span>
            {unreadCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setFilter('READ')}
            className={`px-3 py-1.5 rounded transition cursor-pointer ${
              filter === 'READ'
                ? 'bg-white text-black font-semibold'
                : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            READ ({readCount})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-2.5 py-1 rounded text-[11px] border ${
              unreadCount > 0
                ? 'bg-amber-950/60 border-amber-800/80 text-amber-300'
                : 'bg-neutral-900 border-neutral-800 text-neutral-400'
            }`}
          >
            {unreadCount} Unread Inquiry{unreadCount === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      {/* Split-Pane Inbox */}
      {messages.length === 0 ? (
        <div className="p-12 text-center border border-neutral-800/80 bg-neutral-900/30 rounded-lg space-y-2">
          <Inbox className="w-7 h-7 text-neutral-600 mx-auto" />
          <p className="text-neutral-300 font-semibold">Inbox Empty</p>
          <p className="text-neutral-500">
            No contact inquiries have been received yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Left Pane: Message List */}
          <div className="lg:col-span-5 rounded-lg border border-neutral-800/80 bg-neutral-900/40 overflow-hidden divide-y divide-neutral-800/60 max-h-[640px] overflow-y-auto">
            {filteredMessages.length === 0 ? (
              <div className="p-8 text-center text-neutral-500">
                No messages in this filter.
              </div>
            ) : (
              filteredMessages.map((msg) => {
                const isSelected = selectedMessage?.id === msg.id
                return (
                  <button
                    key={msg.id}
                    type="button"
                    onClick={() => setSelectedId(msg.id)}
                    className={`w-full text-left p-4 transition-colors cursor-pointer block ${
                      isSelected
                        ? 'bg-neutral-800/80 border-l-2 border-l-white'
                        : 'hover:bg-neutral-900/70'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        {!msg.isRead ? (
                          <span
                            className="w-2 h-2 rounded-full bg-amber-400 shrink-0"
                            title="Unread"
                          />
                        ) : (
                          <MailOpen className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
                        )}
                        <span
                          className={`truncate ${
                            !msg.isRead
                              ? 'text-white font-bold'
                              : 'text-neutral-300 font-medium'
                          }`}
                        >
                          {msg.fullName}
                        </span>
                      </div>
                      <span className="text-[10px] text-neutral-500 shrink-0">
                        {new Date(msg.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <p
                      className={`truncate text-[11px] ${
                        !msg.isRead ? 'text-neutral-200 font-semibold' : 'text-neutral-400'
                      }`}
                    >
                      {msg.subject}
                    </p>
                    <p className="truncate text-[11px] text-neutral-500 font-sans mt-1">
                      {msg.content}
                    </p>
                  </button>
                )
              })
            )}
          </div>

          {/* Right Pane: Message Reader */}
          <div className="lg:col-span-7 rounded-lg border border-neutral-800/80 bg-neutral-900/50 p-6 min-h-[380px] flex flex-col justify-between">
            {!selectedMessage ? (
              <div className="flex-1 flex flex-col items-center justify-center text-neutral-600 py-16">
                <Mail className="w-7 h-7 mb-2" />
                <p>Select a message to inspect full telemetry</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Message Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-neutral-800 pb-4">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] border font-semibold ${
                          selectedMessage.isRead
                            ? 'bg-neutral-800 border-neutral-700 text-neutral-400'
                            : 'bg-amber-950/70 border-amber-800 text-amber-300'
                        }`}
                      >
                        {selectedMessage.isRead ? 'READ' : 'UNREAD'}
                      </span>
                      <span className="text-[11px] text-neutral-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(selectedMessage.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <h2 className="text-base font-bold text-white break-words">
                      {selectedMessage.subject}
                    </h2>

                    <div className="text-[11px] text-neutral-400">
                      From:{' '}
                      <span className="text-neutral-200 font-semibold">
                        {selectedMessage.fullName}
                      </span>{' '}
                      &lt;
                      <a
                        href={`mailto:${selectedMessage.email}`}
                        className="text-neutral-300 underline hover:text-white"
                      >
                        {selectedMessage.email}
                      </a>
                      &gt;
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <form action={toggleAction}>
                      <input type="hidden" name="id" value={selectedMessage.id} />
                      <input
                        type="hidden"
                        name="targetIsRead"
                        value={selectedMessage.isRead ? 'false' : 'true'}
                      />
                      <button
                        type="submit"
                        disabled={isTogglePending}
                        className="px-3 py-1.5 rounded border border-neutral-700 bg-neutral-950 text-neutral-200 hover:bg-neutral-800 transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                      >
                        {isTogglePending ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : selectedMessage.isRead ? (
                          <Mail className="w-3.5 h-3.5" />
                        ) : (
                          <MailOpen className="w-3.5 h-3.5" />
                        )}
                        <span>
                          {selectedMessage.isRead
                            ? 'Mark Unread'
                            : 'Mark Read'}
                        </span>
                      </button>
                    </form>

                    <a
                      href={`mailto:${selectedMessage.email}?subject=${encodeURIComponent(
                        `Re: ${selectedMessage.subject}`
                      )}`}
                      className="px-3 py-1.5 rounded bg-white text-black font-semibold hover:bg-neutral-200 transition flex items-center gap-1.5"
                    >
                      <Reply className="w-3.5 h-3.5" />
                      <span>Reply</span>
                    </a>

                    <form action={deleteAction}>
                      <input type="hidden" name="id" value={selectedMessage.id} />
                      <button
                        type="submit"
                        disabled={isDeletePending}
                        className="p-2 rounded border border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-red-400 hover:border-red-900/60 transition disabled:opacity-50 cursor-pointer"
                        title="Delete Message"
                        onClick={(e) => {
                          if (
                            !confirm(
                              `Delete message from "${selectedMessage.fullName}" permanently?`
                            )
                          ) {
                            e.preventDefault()
                          }
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  </div>
                </div>

                {/* Message Body */}
                <div className="p-5 rounded bg-neutral-950/70 border border-neutral-800/80 font-sans text-sm text-neutral-200 leading-relaxed whitespace-pre-wrap break-words min-h-[200px]">
                  {selectedMessage.content}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
