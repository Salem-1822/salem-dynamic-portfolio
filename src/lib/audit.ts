import { prisma } from './prisma'

export interface LogAdminActionParams {
  adminId?: string | null
  action: string
  entityType: string
  entityId?: string | null
}

/**
 * Safely records an audit log entry in the database.
 * Wrapped in try/catch to ensure parent business operations never crash if logging fails.
 */
export async function logAdminAction({
  adminId,
  action,
  entityType,
  entityId,
}: LogAdminActionParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        adminId: adminId ?? null,
        action,
        entityType,
        entityId: entityId ?? null,
      },
    })
  } catch (error) {
    console.error('[AUDIT_LOG_FAILURE] Unable to record audit log:', error)
  }
}
