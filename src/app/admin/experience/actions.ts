'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getCurrentAdmin } from '@/lib/auth'
import { logAdminAction } from '@/lib/audit'

const ExperienceSchema = z.object({
  id: z.string().optional(),
  company: z.string().trim().min(1, 'Company name is required'),
  position: z.string().trim().min(1, 'Position title is required'),
  description: z.string().trim().min(1, 'Description is required'),
  location: z.string().trim().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
  isCurrent: z.boolean().default(false),
  displayOrder: z.coerce.number().default(0),
})

export type ExperienceActionResult = {
  success: boolean
  message?: string
  error?: string
}

export async function createExperienceAction(
  _prevState: ExperienceActionResult | null,
  formData: FormData
): Promise<ExperienceActionResult> {
  const admin = await getCurrentAdmin()
  if (!admin) {
    return { success: false, error: 'Unauthorized: Session invalid or expired.' }
  }

  const isCurrent = formData.get('isCurrent') === 'true' || formData.get('isCurrent') === 'on'
  const rawInput = {
    company: formData.get('company'),
    position: formData.get('position'),
    description: formData.get('description'),
    location: formData.get('location') || undefined,
    startDate: formData.get('startDate'),
    endDate: isCurrent ? undefined : formData.get('endDate') || undefined,
    isCurrent,
    displayOrder: formData.get('displayOrder') || 0,
  }

  const parsed = ExperienceSchema.safeParse(rawInput)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || 'Validation error',
    }
  }

  const skillIds = formData.getAll('skillIds').map((id) => id.toString())

  try {
    const experience = await prisma.$transaction(async (tx) => {
      const exp = await tx.experience.create({
        data: {
          company: parsed.data.company,
          position: parsed.data.position,
          description: parsed.data.description,
          location: parsed.data.location || null,
          startDate: new Date(parsed.data.startDate),
          endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
          isCurrent: parsed.data.isCurrent,
          displayOrder: parsed.data.displayOrder,
        },
      })

      if (skillIds.length > 0) {
        await tx.experienceSkill.createMany({
          data: skillIds.map((skillId) => ({
            experienceId: exp.id,
            skillId,
          })),
        })
      }

      return exp
    })

    await logAdminAction({
      adminId: admin.id,
      action: 'CREATE_EXPERIENCE',
      entityType: 'Experience',
      entityId: experience.id,
    })

    revalidatePath('/admin/experience')
    revalidatePath('/admin')
    revalidatePath('/')

    return { success: true, message: 'Experience record created successfully.' }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Database error occurred.' }
  }
}

export async function updateExperienceAction(
  _prevState: ExperienceActionResult | null,
  formData: FormData
): Promise<ExperienceActionResult> {
  const admin = await getCurrentAdmin()
  if (!admin) {
    return { success: false, error: 'Unauthorized: Session invalid or expired.' }
  }

  const isCurrent = formData.get('isCurrent') === 'true' || formData.get('isCurrent') === 'on'
  const rawInput = {
    id: formData.get('id'),
    company: formData.get('company'),
    position: formData.get('position'),
    description: formData.get('description'),
    location: formData.get('location') || undefined,
    startDate: formData.get('startDate'),
    endDate: isCurrent ? undefined : formData.get('endDate') || undefined,
    isCurrent,
    displayOrder: formData.get('displayOrder') || 0,
  }

  const parsed = ExperienceSchema.safeParse(rawInput)
  if (!parsed.success || !parsed.data.id) {
    return {
      success: false,
      error: !parsed.success ? parsed.error.issues[0]?.message : 'Missing ID',
    }
  }

  const skillIds = formData.getAll('skillIds').map((id) => id.toString())

  try {
    const experienceId = parsed.data.id
    await prisma.$transaction(async (tx) => {
      await tx.experience.update({
        where: { id: experienceId },
        data: {
          company: parsed.data.company,
          position: parsed.data.position,
          description: parsed.data.description,
          location: parsed.data.location || null,
          startDate: new Date(parsed.data.startDate),
          endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
          isCurrent: parsed.data.isCurrent,
          displayOrder: parsed.data.displayOrder,
        },
      })

      // Sync skills
      await tx.experienceSkill.deleteMany({
        where: { experienceId },
      })

      if (skillIds.length > 0) {
        await tx.experienceSkill.createMany({
          data: skillIds.map((skillId) => ({
            experienceId,
            skillId,
          })),
        })
      }
    })

    await logAdminAction({
      adminId: admin.id,
      action: 'UPDATE_EXPERIENCE',
      entityType: 'Experience',
      entityId: experienceId,
    })

    revalidatePath('/admin/experience')
    revalidatePath('/admin')
    revalidatePath('/')

    return { success: true, message: 'Experience record updated successfully.' }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Database error occurred.' }
  }
}

export async function deleteExperienceAction(
  _prevState: ExperienceActionResult | null,
  formData: FormData
): Promise<ExperienceActionResult> {
  const admin = await getCurrentAdmin()
  if (!admin) {
    return { success: false, error: 'Unauthorized: Session invalid or expired.' }
  }

  const id = formData.get('id')?.toString()
  if (!id) {
    return { success: false, error: 'Missing experience ID' }
  }

  try {
    const experience = await prisma.experience.delete({
      where: { id },
    })

    await logAdminAction({
      adminId: admin.id,
      action: 'DELETE_EXPERIENCE',
      entityType: 'Experience',
      entityId: experience.id,
    })

    revalidatePath('/admin/experience')
    revalidatePath('/admin')
    revalidatePath('/')

    return { success: true, message: 'Experience record removed.' }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Database error occurred.' }
  }
}
