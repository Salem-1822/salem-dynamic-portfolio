'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getCurrentAdmin } from '@/lib/auth'
import { logAdminAction } from '@/lib/audit'

const ToggleReadSchema = z.object({
  id: z.string().trim().min(1, 'Missing message ID.'),
  targetIsRead: z.enum(['true', 'false']).optional(),
})

const DeleteMessageSchema = z.object({
  id: z.string().trim().min(1, 'Missing message ID.'),
})

export type MessageActionResult = {
  success: boolean
  message?: string
  error?: string
  deletedId?: string
  timestamp?: number
}

export async function toggleMessageReadAction(
  _prevState: MessageActionResult | null,
  formData: FormData
): Promise<MessageActionResult> {
  const admin = await getCurrentAdmin()
  if (!admin) {
    return {
      success: false,
      error: 'Unauthorized: Session invalid or expired.',
      timestamp: Date.now(),
    }
  }

  const parsed = ToggleReadSchema.safeParse({
    id: formData.get('id'),
    targetIsRead: formData.get('targetIsRead') || undefined,
  })

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || 'Invalid input.',
      timestamp: Date.now(),
    }
  }

  try {
    const existing = await prisma.message.findUnique({
      where: { id: parsed.data.id },
    })

    if (!existing) {
      return {
        success: false,
        error: 'Message not found.',
        timestamp: Date.now(),
      }
    }

    const nextIsRead =
      parsed.data.targetIsRead !== undefined
        ? parsed.data.targetIsRead === 'true'
        : !existing.isRead

    const updated = await prisma.message.update({
      where: { id: existing.id },
      data: { isRead: nextIsRead },
    })

    await logAdminAction({
      adminId: admin.id,
      action: nextIsRead ? 'MARK_MESSAGE_READ' : 'MARK_MESSAGE_UNREAD',
      entityType: 'Message',
      entityId: updated.id,
    })

    revalidatePath('/admin/messages')
    revalidatePath('/admin')
    revalidatePath('/')

    return {
      success: true,
      message: nextIsRead
        ? 'Message marked as read.'
        : 'Message marked as unread.',
      timestamp: Date.now(),
    }
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Failed to update message status.'
    return { success: false, error: message, timestamp: Date.now() }
  }
}

export async function deleteMessageAction(
  _prevState: MessageActionResult | null,
  formData: FormData
): Promise<MessageActionResult> {
  const admin = await getCurrentAdmin()
  if (!admin) {
    return {
      success: false,
      error: 'Unauthorized: Session invalid or expired.',
      timestamp: Date.now(),
    }
  }

  const parsed = DeleteMessageSchema.safeParse({
    id: formData.get('id'),
  })

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || 'Missing message ID.',
      timestamp: Date.now(),
    }
  }

  try {
    const deleted = await prisma.message.delete({
      where: { id: parsed.data.id },
    })

    await logAdminAction({
      adminId: admin.id,
      action: 'DELETE_MESSAGE',
      entityType: 'Message',
      entityId: deleted.id,
    })

    revalidatePath('/admin/messages')
    revalidatePath('/admin')
    revalidatePath('/')

    return {
      success: true,
      message: `Message from "${deleted.fullName}" deleted.`,
      deletedId: deleted.id,
      timestamp: Date.now(),
    }
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Failed to delete message.'
    return { success: false, error: message, timestamp: Date.now() }
  }
}
