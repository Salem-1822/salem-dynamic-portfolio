'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getCurrentAdmin } from '@/lib/auth'
import { logAdminAction } from '@/lib/audit'
import { SkillCategory } from '@prisma/client'

const SkillSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, 'Skill name is required'),
  category: z.nativeEnum(SkillCategory, {
    message: 'Invalid category',
  }),
  level: z.coerce.number().min(1).max(100).optional().nullable(),
  icon: z.string().trim().optional().nullable(),
  displayOrder: z.coerce.number().default(0),
})

export type SkillActionResult = {
  success: boolean
  message?: string
  error?: string
}

export async function createSkillAction(
  _prevState: SkillActionResult | null,
  formData: FormData
): Promise<SkillActionResult> {
  const admin = await getCurrentAdmin()
  if (!admin) {
    return { success: false, error: 'Unauthorized: Session invalid or expired.' }
  }

  const rawInput = {
    name: formData.get('name'),
    category: formData.get('category'),
    level: formData.get('level') || null,
    icon: formData.get('icon') || null,
    displayOrder: formData.get('displayOrder') || 0,
  }

  const parsed = SkillSchema.safeParse(rawInput)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || 'Validation error',
    }
  }

  try {
    const skill = await prisma.skill.create({
      data: {
        name: parsed.data.name,
        category: parsed.data.category,
        level: parsed.data.level,
        icon: parsed.data.icon,
        displayOrder: parsed.data.displayOrder,
      },
    })

    await logAdminAction({
      adminId: admin.id,
      action: 'CREATE_SKILL',
      entityType: 'Skill',
      entityId: skill.id,
    })

    revalidatePath('/admin/skills')
    revalidatePath('/admin')
    revalidatePath('/')

    return { success: true, message: `Skill "${skill.name}" created successfully.` }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Database error occurred.' }
  }
}

export async function updateSkillAction(
  _prevState: SkillActionResult | null,
  formData: FormData
): Promise<SkillActionResult> {
  const admin = await getCurrentAdmin()
  if (!admin) {
    return { success: false, error: 'Unauthorized: Session invalid or expired.' }
  }

  const rawInput = {
    id: formData.get('id'),
    name: formData.get('name'),
    category: formData.get('category'),
    level: formData.get('level') || null,
    icon: formData.get('icon') || null,
    displayOrder: formData.get('displayOrder') || 0,
  }

  const parsed = SkillSchema.safeParse(rawInput)
  if (!parsed.success || !parsed.data.id) {
    return {
      success: false,
      error: !parsed.success
        ? parsed.error.issues[0]?.message
        : 'Missing skill ID',
    }
  }

  try {
    const skill = await prisma.skill.update({
      where: { id: parsed.data.id },
      data: {
        name: parsed.data.name,
        category: parsed.data.category,
        level: parsed.data.level,
        icon: parsed.data.icon,
        displayOrder: parsed.data.displayOrder,
      },
    })

    await logAdminAction({
      adminId: admin.id,
      action: 'UPDATE_SKILL',
      entityType: 'Skill',
      entityId: skill.id,
    })

    revalidatePath('/admin/skills')
    revalidatePath('/admin')
    revalidatePath('/')

    return { success: true, message: `Skill "${skill.name}" updated successfully.` }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Database error occurred.' }
  }
}

export async function deleteSkillAction(
  _prevState: SkillActionResult | null,
  formData: FormData
): Promise<SkillActionResult> {
  const admin = await getCurrentAdmin()
  if (!admin) {
    return { success: false, error: 'Unauthorized: Session invalid or expired.' }
  }

  const id = formData.get('id')?.toString()
  if (!id) {
    return { success: false, error: 'Missing skill ID' }
  }

  try {
    const skill = await prisma.skill.delete({
      where: { id },
    })

    await logAdminAction({
      adminId: admin.id,
      action: 'DELETE_SKILL',
      entityType: 'Skill',
      entityId: skill.id,
    })

    revalidatePath('/admin/skills')
    revalidatePath('/admin')
    revalidatePath('/')

    return { success: true, message: `Skill "${skill.name}" deleted successfully.` }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Database error occurred.' }
  }
}
