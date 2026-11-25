import crypto from 'node:crypto'
import { cookies } from 'next/headers'
import { prisma } from './prisma'
import type { Admin } from '@prisma/client'

export const SESSION_COOKIE_NAME = 'admin_session'
export const SESSION_MAX_AGE_SECONDS = 24 * 60 * 60 // 24 hours

export type SafeAdmin = Omit<Admin, 'passwordHash' | 'twoFactorSecret'>

/**
 * Generates a cryptographically secure 32-byte (64-character hex) session token.
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Generates a SHA-256 hash of the provided session token for secure storage.
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

/**
 * Creates an admin session record in PostgreSQL and issues a secure HttpOnly cookie.
 */
export async function createAdminSession(
  adminId: string,
  ipAddress?: string | null,
  userAgent?: string | null
) {
  const token = generateSessionToken()
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000)

  const session = await prisma.adminSession.create({
    data: {
      adminId,
      tokenHash,
      ipAddress: ipAddress ?? null,
      userAgent: userAgent ?? null,
      expiresAt,
    },
  })

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    expires: expiresAt,
  })

  return { token, session }
}

/**
 * Retrieves the currently authenticated admin based on the incoming session cookie.
 * Returns null if the session is missing, expired, or if the admin account is inactive.
 */
export async function getCurrentAdmin(): Promise<SafeAdmin | null> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)

  if (!sessionCookie?.value) {
    return null
  }

  try {
    const tokenHash = hashToken(sessionCookie.value)

    const session = await prisma.adminSession.findUnique({
      where: { tokenHash },
      include: {
        admin: true,
      },
    })

    if (!session) {
      return null
    }

    // Check expiration
    if (session.expiresAt <= new Date()) {
      await prisma.adminSession.delete({
        where: { id: session.id },
      }).catch(() => {})
      return null
    }

    // Check admin status
    if (!session.admin || !session.admin.isActive) {
      return null
    }

    const { passwordHash, twoFactorSecret, ...safeAdmin } = session.admin
    return safeAdmin
  } catch (error) {
    console.error('[AUTH_LOOKUP_ERROR] Failed to retrieve current admin:', error)
    return null
  }
}

/**
 * Destroys the current admin session in the database and wipes the session cookie.
 */
export async function invalidateAdminSession(): Promise<void> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)

  if (sessionCookie?.value) {
    try {
      const tokenHash = hashToken(sessionCookie.value)
      await prisma.adminSession.deleteMany({
        where: { tokenHash },
      })
    } catch (error) {
      console.error('[AUTH_INVALIDATION_ERROR] Failed to invalidate admin session:', error)
    }
  }

  cookieStore.delete(SESSION_COOKIE_NAME)
}
