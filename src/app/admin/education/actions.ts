'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getCurrentAdmin } from '@/lib/auth'
import { logAdminAction } from '@/lib/audit'

const EducationSchema = z.object({
  id: z.string().optional(),
  institution: z.string().trim().min(1, 'Institution is required'),
  degree: z.string().trim().min(1, 'Degree is required'),
  fieldOfStudy: z.string().trim().min(1, 'Field of study is required'),
  description: z.string().trim().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
  isCurrent: z.boolean().default(false),
  displayOrder: z.coerce.number().default(0),
})

export type EducationActionResult = {
  success: boolean
  message?: string
  error?: string
}

export async function createEducationAction(
  _prevState: EducationActionResult | null,
  formData: FormData
): Promise<EducationActionResult> {
  const admin = await getCurrentAdmin()
  if (!admin) {
    return { success: false, error: 'Unauthorized: Session invalid or expired.' }
  }

  const isCurrent = formData.get('isCurrent') === 'true' || formData.get('isCurrent') === 'on'
  const rawInput = {
    institution: formData.get('institution'),
    degree: formData.get('degree'),
    fieldOfStudy: formData.get('fieldOfStudy'),
    description: formData.get('description') || undefined,
    startDate: formData.get('startDate'),
    endDate: isCurrent ? undefined : formData.get('endDate') || undefined,
    isCurrent,
    displayOrder: formData.get('displayOrder') || 0,
  }

  const parsed = EducationSchema.safeParse(rawInput)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || 'Validation error',
    }
  }

  try {
    const education = await prisma.education.create({
      data: {
        institution: parsed.data.institution,
        degree: parsed.data.degree,
        fieldOfStudy: parsed.data.fieldOfStudy,
        description: parsed.data.description || null,
        startDate: new Date(parsed.data.startDate),
        endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
        isCurrent: parsed.data.isCurrent,
        displayOrder: parsed.data.displayOrder,
      },
    })

    await logAdminAction({
      adminId: admin.id,
      action: 'CREATE_EDUCATION',
      entityType: 'Education',
      entityId: education.id,
    })

    revalidatePath('/admin/education')
    revalidatePath('/admin')
    revalidatePath('/')

    return { success: true, message: 'Education entry created successfully.' }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Database error occurred.' }
  }
}

export async function updateEducationAction(
  _prevState: EducationActionResult | null,
  formData: FormData
): Promise<EducationActionResult> {
  const admin = await getCurrentAdmin()
  if (!admin) {
    return { success: false, error: 'Unauthorized: Session invalid or expired.' }
  }

  const isCurrent = formData.get('isCurrent') === 'true' || formData.get('isCurrent') === 'on'
  const rawInput = {
    id: formData.get('id'),
    institution: formData.get('institution'),
    degree: formData.get('degree'),
    fieldOfStudy: formData.get('fieldOfStudy'),
    description: formData.get('description') || undefined,
    startDate: formData.get('startDate'),
    endDate: isCurrent ? undefined : formData.get('endDate') || undefined,
    isCurrent,
    displayOrder: formData.get('displayOrder') || 0,
  }

  const parsed = EducationSchema.safeParse(rawInput)
  if (!parsed.success || !parsed.data.id) {
    return {
      success: false,
      error: !parsed.success ? parsed.error.issues[0]?.message : 'Missing ID',
    }
  }

  try {
    const education = await prisma.education.update({
      where: { id: parsed.data.id },
      data: {
        institution: parsed.data.institution,
        degree: parsed.data.degree,
        fieldOfStudy: parsed.data.fieldOfStudy,
        description: parsed.data.description || null,
        startDate: new Date(parsed.data.startDate),
        endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
        isCurrent: parsed.data.isCurrent,
        displayOrder: parsed.data.displayOrder,
      },
    })

    await logAdminAction({
      adminId: admin.id,
      action: 'UPDATE_EDUCATION',
      entityType: 'Education',
      entityId: education.id,
    })

    revalidatePath('/admin/education')
    revalidatePath('/admin')
    revalidatePath('/')

    return { success: true, message: 'Education entry updated successfully.' }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Database error occurred.' }
  }
}

export async function deleteEducationAction(
  _prevState: EducationActionResult | null,
  formData: FormData
): Promise<EducationActionResult> {
  const admin = await getCurrentAdmin()
  if (!admin) {
    return { success: false, error: 'Unauthorized: Session invalid or expired.' }
  }

  const id = formData.get('id')?.toString()
  if (!id) {
    return { success: false, error: 'Missing education ID' }
  }

  try {
    const education = await prisma.education.delete({
      where: { id },
    })

    await logAdminAction({
      adminId: admin.id,
      action: 'DELETE_EDUCATION',
      entityType: 'Education',
      entityId: education.id,
    })

    revalidatePath('/admin/education')
    revalidatePath('/admin')
    revalidatePath('/')

    return { success: true, message: 'Education entry deleted.' }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Database error occurred.' }
  }
}
