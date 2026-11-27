'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { ProjectStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getCurrentAdmin } from '@/lib/auth'
import { logAdminAction } from '@/lib/audit'
import { uploadToCloudinary } from '@/lib/cloudinary'

const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
])
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const ProjectSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(1, 'Project title is required'),
  slug: z.string().trim().optional(),
  description: z.string().trim().min(1, 'Project description is required'),
  imageUrl: z
    .string()
    .trim()
    .url('Invalid cover image URL')
    .optional()
    .or(z.literal('')),
  githubUrl: z
    .string()
    .trim()
    .url('Invalid GitHub URL')
    .optional()
    .or(z.literal('')),
  liveUrl: z
    .string()
    .trim()
    .url('Invalid Live URL')
    .optional()
    .or(z.literal('')),
  featured: z.boolean().default(false),
  status: z.nativeEnum(ProjectStatus, {
    message: 'Invalid project status',
  }),
  displayOrder: z.coerce.number().int().default(0),
})

export type ProjectActionResult = {
  success: boolean
  message?: string
  error?: string
  timestamp?: number
}

async function resolveCoverImage(
  formData: FormData,
  fallbackUrl: string | undefined
): Promise<{ url: string | null; error?: string }> {
  const fileEntry = formData.get('coverImage')

  if (fileEntry instanceof File && fileEntry.size > 0) {
    if (!ALLOWED_IMAGE_TYPES.has(fileEntry.type)) {
      return {
        url: null,
        error: 'Unsupported image format. Allowed types: JPEG, PNG, WebP, GIF, AVIF.',
      }
    }

    if (fileEntry.size > MAX_IMAGE_SIZE_BYTES) {
      return {
        url: null,
        error: 'Cover image exceeds maximum size of 5MB.',
      }
    }

    const arrayBuffer = await fileEntry.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const uploaded = await uploadToCloudinary(buffer, {
      folder: 'portfolio/projects',
      resourceType: 'image',
    })

    return { url: uploaded.secureUrl }
  }

  return { url: fallbackUrl || null }
}

export async function createProjectAction(
  _prevState: ProjectActionResult | null,
  formData: FormData
): Promise<ProjectActionResult> {
  const admin = await getCurrentAdmin()
  if (!admin) {
    return {
      success: false,
      error: 'Unauthorized: Session invalid or expired.',
      timestamp: Date.now(),
    }
  }

  const featured =
    formData.get('featured') === 'true' || formData.get('featured') === 'on'

  const rawInput = {
    title: formData.get('title'),
    slug: formData.get('slug') || undefined,
    description: formData.get('description'),
    imageUrl: formData.get('imageUrl') || undefined,
    githubUrl: formData.get('githubUrl') || undefined,
    liveUrl: formData.get('liveUrl') || undefined,
    featured,
    status: formData.get('status') || ProjectStatus.COMPLETED,
    displayOrder: formData.get('displayOrder') || 0,
  }

  const parsed = ProjectSchema.safeParse(rawInput)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || 'Validation error.',
      timestamp: Date.now(),
    }
  }

  const resolvedSlug = slugify(parsed.data.slug || parsed.data.title)
  if (!resolvedSlug) {
    return {
      success: false,
      error: 'Unable to generate a valid slug. Please provide an alphanumeric title or slug.',
      timestamp: Date.now(),
    }
  }

  const skillIds = Array.from(
    new Set(
      formData
        .getAll('skillIds')
        .map((id) => id.toString().trim())
        .filter(Boolean)
    )
  )

  try {
    const existingSlug = await prisma.project.findUnique({
      where: { slug: resolvedSlug },
      select: { id: true },
    })

    if (existingSlug) {
      return {
        success: false,
        error: `A project with slug "${resolvedSlug}" already exists.`,
        timestamp: Date.now(),
      }
    }

    const coverResult = await resolveCoverImage(formData, parsed.data.imageUrl)
    if (coverResult.error) {
      return {
        success: false,
        error: coverResult.error,
        timestamp: Date.now(),
      }
    }

    const project = await prisma.$transaction(async (tx) => {
      const created = await tx.project.create({
        data: {
          title: parsed.data.title,
          slug: resolvedSlug,
          description: parsed.data.description,
          imageUrl: coverResult.url,
          githubUrl: parsed.data.githubUrl || null,
          liveUrl: parsed.data.liveUrl || null,
          featured: parsed.data.featured,
          status: parsed.data.status,
          displayOrder: parsed.data.displayOrder,
        },
      })

      if (skillIds.length > 0) {
        await tx.projectSkill.createMany({
          data: skillIds.map((skillId) => ({
            projectId: created.id,
            skillId,
          })),
        })
      }

      return created
    })

    await logAdminAction({
      adminId: admin.id,
      action: 'CREATE_PROJECT',
      entityType: 'Project',
      entityId: project.id,
    })

    revalidatePath('/admin/projects')
    revalidatePath('/admin')
    revalidatePath('/')

    return {
      success: true,
      message: `Project "${project.title}" created successfully.`,
      timestamp: Date.now(),
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database or upload error occurred.'
    return { success: false, error: message, timestamp: Date.now() }
  }
}

export async function updateProjectAction(
  _prevState: ProjectActionResult | null,
  formData: FormData
): Promise<ProjectActionResult> {
  const admin = await getCurrentAdmin()
  if (!admin) {
    return {
      success: false,
      error: 'Unauthorized: Session invalid or expired.',
      timestamp: Date.now(),
    }
  }

  const featured =
    formData.get('featured') === 'true' || formData.get('featured') === 'on'

  const rawInput = {
    id: formData.get('id'),
    title: formData.get('title'),
    slug: formData.get('slug') || undefined,
    description: formData.get('description'),
    imageUrl: formData.get('imageUrl') || undefined,
    githubUrl: formData.get('githubUrl') || undefined,
    liveUrl: formData.get('liveUrl') || undefined,
    featured,
    status: formData.get('status') || ProjectStatus.COMPLETED,
    displayOrder: formData.get('displayOrder') || 0,
  }

  const parsed = ProjectSchema.safeParse(rawInput)
  if (!parsed.success || !parsed.data.id) {
    return {
      success: false,
      error: !parsed.success
        ? parsed.error.issues[0]?.message || 'Validation error.'
        : 'Missing project ID.',
      timestamp: Date.now(),
    }
  }

  const projectId = parsed.data.id
  const resolvedSlug = slugify(parsed.data.slug || parsed.data.title)
  if (!resolvedSlug) {
    return {
      success: false,
      error: 'Unable to generate a valid slug. Please provide an alphanumeric title or slug.',
      timestamp: Date.now(),
    }
  }

  const skillIds = Array.from(
    new Set(
      formData
        .getAll('skillIds')
        .map((id) => id.toString().trim())
        .filter(Boolean)
    )
  )

  try {
    const conflictingSlug = await prisma.project.findFirst({
      where: {
        slug: resolvedSlug,
        NOT: { id: projectId },
      },
      select: { id: true },
    })

    if (conflictingSlug) {
      return {
        success: false,
        error: `Another project already uses the slug "${resolvedSlug}".`,
        timestamp: Date.now(),
      }
    }

    const coverResult = await resolveCoverImage(formData, parsed.data.imageUrl)
    if (coverResult.error) {
      return {
        success: false,
        error: coverResult.error,
        timestamp: Date.now(),
      }
    }

    const project = await prisma.$transaction(async (tx) => {
      const updated = await tx.project.update({
        where: { id: projectId },
        data: {
          title: parsed.data.title,
          slug: resolvedSlug,
          description: parsed.data.description,
          imageUrl: coverResult.url,
          githubUrl: parsed.data.githubUrl || null,
          liveUrl: parsed.data.liveUrl || null,
          featured: parsed.data.featured,
          status: parsed.data.status,
          displayOrder: parsed.data.displayOrder,
        },
      })

      await tx.projectSkill.deleteMany({
        where: { projectId },
      })

      if (skillIds.length > 0) {
        await tx.projectSkill.createMany({
          data: skillIds.map((skillId) => ({
            projectId,
            skillId,
          })),
        })
      }

      return updated
    })

    await logAdminAction({
      adminId: admin.id,
      action: 'UPDATE_PROJECT',
      entityType: 'Project',
      entityId: project.id,
    })

    revalidatePath('/admin/projects')
    revalidatePath('/admin')
    revalidatePath('/')

    return {
      success: true,
      message: `Project "${project.title}" updated successfully.`,
      timestamp: Date.now(),
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database or upload error occurred.'
    return { success: false, error: message, timestamp: Date.now() }
  }
}

export async function deleteProjectAction(
  _prevState: ProjectActionResult | null,
  formData: FormData
): Promise<ProjectActionResult> {
  const admin = await getCurrentAdmin()
  if (!admin) {
    return {
      success: false,
      error: 'Unauthorized: Session invalid or expired.',
      timestamp: Date.now(),
    }
  }

  const id = formData.get('id')?.toString().trim()
  if (!id) {
    return { success: false, error: 'Missing project ID.', timestamp: Date.now() }
  }

  try {
    const project = await prisma.project.delete({
      where: { id },
    })

    await logAdminAction({
      adminId: admin.id,
      action: 'DELETE_PROJECT',
      entityType: 'Project',
      entityId: project.id,
    })

    revalidatePath('/admin/projects')
    revalidatePath('/admin')
    revalidatePath('/')

    return {
      success: true,
      message: `Project "${project.title}" deleted.`,
      timestamp: Date.now(),
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error occurred.'
    return { success: false, error: message, timestamp: Date.now() }
  }
}
