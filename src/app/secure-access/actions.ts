'use server'

import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { createAdminSession, invalidateAdminSession } from '@/lib/auth'
import { logAdminAction } from '@/lib/audit'

const LoginSchema = z.object({
  email: z.string().trim().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
})

interface RateLimitRecord {
  attempts: number
  lockedUntil: number
}

// In-memory rate limiter: maximum 5 failed attempts per IP per 15 minutes
const rateLimitMap = new Map<string, RateLimitRecord>()

function checkRateLimit(ip: string): { allowed: boolean; retryAfterMinutes?: number } {
  const now = Date.now()
  const record = rateLimitMap.get(ip)

  if (!record) {
    return { allowed: true }
  }

  if (now > record.lockedUntil) {
    rateLimitMap.delete(ip)
    return { allowed: true }
  }

  if (record.attempts >= 5) {
    const retryAfterMinutes = Math.ceil((record.lockedUntil - now) / 60000)
    return { allowed: false, retryAfterMinutes }
  }

  return { allowed: true }
}

function recordFailedAttempt(ip: string): void {
  const now = Date.now()
  const lockoutWindow = 15 * 60 * 1000 // 15 minutes
  const record = rateLimitMap.get(ip)

  if (!record || now > record.lockedUntil) {
    rateLimitMap.set(ip, {
      attempts: 1,
      lockedUntil: now + lockoutWindow,
    })
  } else {
    record.attempts += 1
  }
}

function clearRateLimit(ip: string): void {
  rateLimitMap.delete(ip)
}

export type LoginResult = {
  success: boolean
  error?: string
}

export async function loginAction(
  _prevState: LoginResult | null,
  formData: FormData
): Promise<LoginResult> {
  const headerStore = await headers()
  const clientIp =
    headerStore.get('x-forwarded-for')?.split(',')[0].trim() ||
    headerStore.get('x-real-ip') ||
    '127.0.0.1'
  const userAgent = headerStore.get('user-agent') || 'unknown'

  // 1. Rate limiter verification
  const rateLimit = checkRateLimit(clientIp)
  if (!rateLimit.allowed) {
    return {
      success: false,
      error: `Too many failed attempts. Access locked for ${rateLimit.retryAfterMinutes} minute(s).`,
    }
  }

  // 2. Strict Input validation
  const rawInput = {
    email: formData.get('email'),
    password: formData.get('password'),
  }

  const parsed = LoginSchema.safeParse(rawInput)
  if (!parsed.success) {
    // Return generic error to prevent enumeration
    return {
      success: false,
      error: 'Invalid credentials',
    }
  }

  const { email, password } = parsed.data

  // 3. Admin lookup
  const admin = await prisma.admin.findUnique({
    where: { email: email.toLowerCase() },
  })

  if (!admin || !admin.isActive) {
    recordFailedAttempt(clientIp)
    await logAdminAction({
      adminId: null,
      action: 'FAILED_LOGIN_ATTEMPT',
      entityType: 'Admin',
      entityId: null,
    })
    return {
      success: false,
      error: 'Invalid credentials',
    }
  }

  // 4. Constant-time password comparison
  const isMatch = await bcrypt.compare(password, admin.passwordHash)
  if (!isMatch) {
    recordFailedAttempt(clientIp)
    await logAdminAction({
      adminId: admin.id,
      action: 'FAILED_LOGIN_ATTEMPT',
      entityType: 'Admin',
      entityId: admin.id,
    })
    return {
      success: false,
      error: 'Invalid credentials',
    }
  }

  // 5. Success: clear rate limit, establish session, record audit
  clearRateLimit(clientIp)
  await createAdminSession(admin.id, clientIp, userAgent)
  await logAdminAction({
    adminId: admin.id,
    action: 'ADMIN_LOGIN',
    entityType: 'Admin',
    entityId: admin.id,
  })

  redirect('/admin')
}

export async function logoutAction() {
  await invalidateAdminSession()
  redirect('/secure-access')
}
