'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getCurrentAdmin } from '@/lib/auth'
import { logAdminAction } from '@/lib/audit'

const ProfileSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required'),
  headline: z.string().trim().min(1, 'Headline is required'),
  bio: z.string().trim().min(1, 'Bio is required'),
  email: z.string().trim().email('Invalid email address'),
  phone: z.string().trim().optional(),
  location: z.string().trim().min(1, 'Location is required'),
  githubUrl: z
    .string()
    .trim()
    .url('Invalid GitHub URL')
    .optional()
    .or(z.literal('')),
  linkedinUrl: z
    .string()
    .trim()
    .url('Invalid LinkedIn URL')
    .optional()
    .or(z.literal('')),
  avatarUrl: z
    .string()
    .trim()
    .url('Invalid Avatar URL')
    .optional()
    .or(z.literal('')),
})

export type ProfileActionResult = {
  success: boolean
  message?: string
  error?: string
}

export async function updateProfileAction(
  _prevState: ProfileActionResult | null,
  formData: FormData
): Promise<ProfileActionResult> {
  const admin = await getCurrentAdmin()
  if (!admin) {
    return { success: false, error: 'Unauthorized: Session invalid or expired.' }
  }

  const rawInput = {
    fullName: formData.get('fullName'),
    headline: formData.get('headline'),
    bio: formData.get('bio'),
    email: formData.get('email'),
    phone: formData.get('phone') || undefined,
    location: formData.get('location'),
    githubUrl: formData.get('githubUrl') || undefined,
    linkedinUrl: formData.get('linkedinUrl') || undefined,
    avatarUrl: formData.get('avatarUrl') || undefined,
  }

  const parsed = ProfileSchema.safeParse(rawInput)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || 'Invalid form input.',
    }
  }

  const data = {
    fullName: parsed.data.fullName,
    headline: parsed.data.headline,
    bio: parsed.data.bio,
    email: parsed.data.email,
    phone: parsed.data.phone || null,
    location: parsed.data.location,
    githubUrl: parsed.data.githubUrl || null,
    linkedinUrl: parsed.data.linkedinUrl || null,
    avatarUrl: parsed.data.avatarUrl || null,
  }

  try {
    const existing = await prisma.profile.findFirst()
    const profile = existing
      ? await prisma.profile.update({
          where: { id: existing.id },
          data,
        })
      : await prisma.profile.create({
          data,
        })

    await logAdminAction({
      adminId: admin.id,
      action: 'UPDATE_PROFILE',
      entityType: 'Profile',
      entityId: profile.id,
    })

    revalidatePath('/admin/profile')
    revalidatePath('/admin')
    revalidatePath('/')

    return { success: true, message: 'Profile details saved successfully.' }
  } catch (err: any) {
    console.error('[PROFILE_UPDATE_ERROR]', err)
    return { success: false, error: err?.message || 'Database error occurred.' }
  }
}
