'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getCurrentAdmin } from '@/lib/auth'
import { logAdminAction } from '@/lib/audit'
import { deleteFromCloudinary, uploadToCloudinary } from '@/lib/cloudinary'

const MAX_CV_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB

const IdSchema = z.object({
  id: z.string().trim().min(1, 'Missing CV ID.'),
})

export type CVActionResult = {
  success: boolean
  message?: string
  error?: string
  timestamp?: number
}

function sanitizePdfBaseName(fileName: string): string {
  const withoutExt = fileName.replace(/\.pdf$/i, '')
  const cleaned = withoutExt
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return cleaned || 'resume'
}

export async function uploadCVAction(
  _prevState: CVActionResult | null,
  formData: FormData
): Promise<CVActionResult> {
  const admin = await getCurrentAdmin()
  if (!admin) {
    return {
      success: false,
      error: 'Unauthorized: Session invalid or expired.',
      timestamp: Date.now(),
    }
  }

  const fileEntry = formData.get('cvFile')
  if (!(fileEntry instanceof File) || fileEntry.size === 0) {
    return {
      success: false,
      error: 'Please select a PDF file to upload.',
      timestamp: Date.now(),
    }
  }

  if (fileEntry.type !== 'application/pdf') {
    return {
      success: false,
      error: 'Invalid file type. Only PDF documents (application/pdf) are accepted.',
      timestamp: Date.now(),
    }
  }

  if (fileEntry.size > MAX_CV_SIZE_BYTES) {
    return {
      success: false,
      error: 'File exceeds the maximum allowed size of 5MB.',
      timestamp: Date.now(),
    }
  }

  let uploadedPublicId: string | null = null

  try {
    const arrayBuffer = await fileEntry.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Verify PDF magic bytes (%PDF-)
    if (buffer.subarray(0, 5).toString('ascii') !== '%PDF-') {
      return {
        success: false,
        error: 'File signature mismatch. Please upload a valid PDF document.',
        timestamp: Date.now(),
      }
    }

    const baseName = sanitizePdfBaseName(fileEntry.name)
    const publicId = `${baseName}-${Date.now()}.pdf`

    const uploadResult = await uploadToCloudinary(buffer, {
      folder: 'portfolio/cv',
      resourceType: 'raw',
      publicId,
    })

    uploadedPublicId = uploadResult.publicId

    const createdCV = await prisma.$transaction(async (tx) => {
      const existingCount = await tx.cV.count()
      const shouldActivate = existingCount === 0

      return tx.cV.create({
        data: {
          adminId: admin.id,
          fileName: fileEntry.name,
          fileUrl: uploadResult.secureUrl,
          publicId: uploadResult.publicId,
          fileSize: uploadResult.bytes || fileEntry.size,
          isActive: shouldActivate,
        },
      })
    })

    await logAdminAction({
      adminId: admin.id,
      action: 'UPLOAD_CV',
      entityType: 'CV',
      entityId: createdCV.id,
    })

    revalidatePath('/admin/cv')
    revalidatePath('/admin')
    revalidatePath('/')

    return {
      success: true,
      message: createdCV.isActive
        ? `Uploaded "${createdCV.fileName}" and set as active CV.`
        : `Uploaded "${createdCV.fileName}" successfully.`,
      timestamp: Date.now(),
    }
  } catch (err: unknown) {
    if (uploadedPublicId) {
      await deleteFromCloudinary(uploadedPublicId, 'raw').catch(() => {})
    }
    const message =
      err instanceof Error ? err.message : 'Failed to upload CV document.'
    return { success: false, error: message, timestamp: Date.now() }
  }
}

export async function activateCVAction(
  _prevState: CVActionResult | null,
  formData: FormData
): Promise<CVActionResult> {
  const admin = await getCurrentAdmin()
  if (!admin) {
    return {
      success: false,
      error: 'Unauthorized: Session invalid or expired.',
      timestamp: Date.now(),
    }
  }

  const parsed = IdSchema.safeParse({ id: formData.get('id') })
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || 'Missing CV ID.',
      timestamp: Date.now(),
    }
  }

  try {
    const activated = await prisma.$transaction(async (tx) => {
      const target = await tx.cV.findUnique({
        where: { id: parsed.data.id },
      })

      if (!target) {
        throw new Error('CV document not found.')
      }

      await tx.cV.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      })

      return tx.cV.update({
        where: { id: target.id },
        data: { isActive: true },
      })
    })

    await logAdminAction({
      adminId: admin.id,
      action: 'ACTIVATE_CV',
      entityType: 'CV',
      entityId: activated.id,
    })

    revalidatePath('/admin/cv')
    revalidatePath('/admin')
    revalidatePath('/')

    return {
      success: true,
      message: `"${activated.fileName}" is now the active public CV.`,
      timestamp: Date.now(),
    }
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Failed to activate CV.'
    return { success: false, error: message, timestamp: Date.now() }
  }
}

export async function deleteCVAction(
  _prevState: CVActionResult | null,
  formData: FormData
): Promise<CVActionResult> {
  const admin = await getCurrentAdmin()
  if (!admin) {
    return {
      success: false,
      error: 'Unauthorized: Session invalid or expired.',
      timestamp: Date.now(),
    }
  }

  const parsed = IdSchema.safeParse({ id: formData.get('id') })
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || 'Missing CV ID.',
      timestamp: Date.now(),
    }
  }

  try {
    const cv = await prisma.cV.findUnique({
      where: { id: parsed.data.id },
    })

    if (!cv) {
      return {
        success: false,
        error: 'CV document not found.',
        timestamp: Date.now(),
      }
    }

    // Delete from Cloudinary first via publicId
    await deleteFromCloudinary(cv.publicId, 'auto')

    // Delete from Prisma CV table
    await prisma.cV.delete({
      where: { id: cv.id },
    })

    await logAdminAction({
      adminId: admin.id,
      action: 'DELETE_CV',
      entityType: 'CV',
      entityId: cv.id,
    })

    revalidatePath('/admin/cv')
    revalidatePath('/admin')
    revalidatePath('/')

    return {
      success: true,
      message: `Deleted "${cv.fileName}" from Cloudinary and database.`,
      timestamp: Date.now(),
    }
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Failed to delete CV document.'
    return { success: false, error: message, timestamp: Date.now() }
  }
}
