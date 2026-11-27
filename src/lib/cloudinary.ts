import { v2 as cloudinary, type UploadApiOptions } from 'cloudinary'

export interface CloudinaryUploadOptions {
  folder: string
  resourceType?: 'image' | 'raw' | 'auto'
  publicId?: string
}

export interface CloudinaryUploadResult {
  secureUrl: string
  publicId: string
  bytes: number
}

function configureCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      'Missing Cloudinary credentials. Ensure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET are configured.'
    )
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  })
}

/**
 * Uploads a Buffer directly to Cloudinary using upload_stream.
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  options: CloudinaryUploadOptions
): Promise<CloudinaryUploadResult> {
  configureCloudinary()

  const uploadOptions: UploadApiOptions = {
    folder: options.folder,
    resource_type: options.resourceType ?? 'auto',
    ...(options.publicId ? { public_id: options.publicId } : {}),
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error || !result) {
        reject(error ?? new Error('Cloudinary upload failed without returning a result.'))
        return
      }

      resolve({
        secureUrl: result.secure_url,
        publicId: result.public_id,
        bytes: result.bytes,
      })
    })

    stream.end(buffer)
  })
}

/**
 * Deletes an asset from Cloudinary by its publicId.
 * When resourceType is 'auto', tries deleting as 'raw' and 'image' to handle PDFs or images safely.
 */
export async function deleteFromCloudinary(
  publicId: string,
  resourceType: 'image' | 'raw' | 'auto' = 'image'
): Promise<void> {
  configureCloudinary()

  const typesToAttempt: Array<'image' | 'raw'> =
    resourceType === 'auto' ? ['raw', 'image'] : [resourceType]

  let lastError: unknown = null

  for (const type of typesToAttempt) {
    try {
      const response = await cloudinary.uploader.destroy(publicId, {
        resource_type: type,
        invalidate: true,
      })

      if (response?.result === 'ok') {
        return
      }

      if (response?.result === 'not found') {
        continue
      }
    } catch (error) {
      lastError = error
    }
  }

  if (lastError) {
    throw lastError
  }
}
