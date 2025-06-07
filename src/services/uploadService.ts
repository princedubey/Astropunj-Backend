import { supabaseAdmin } from "../config/supabase"
import { createError } from "../middlewares/errorHandler"
import crypto from "crypto"

export interface UploadConfig {
  bucket: string
  folder: string
  allowedTypes: string[]
  maxSize: number // in bytes
}

export class UploadService {
  private static readonly BUCKETS = {
    PROFILE_IMAGES: "profile-images",
    KUNDALIS: "kundalis",
    CHAT_MEDIA: "chat-media",
  }

  private static readonly UPLOAD_CONFIGS: Record<string, UploadConfig> = {
    profile: {
      bucket: UploadService.BUCKETS.PROFILE_IMAGES,
      folder: "avatars",
      allowedTypes: ["image/jpeg", "image/png", "image/webp"],
      maxSize: 5 * 1024 * 1024, // 5MB
    },
    kundali: {
      bucket: UploadService.BUCKETS.KUNDALIS,
      folder: "charts",
      allowedTypes: ["image/jpeg", "image/png", "application/pdf"],
      maxSize: 10 * 1024 * 1024, // 10MB
    },
    chatImage: {
      bucket: UploadService.BUCKETS.CHAT_MEDIA,
      folder: "images",
      allowedTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
      maxSize: 5 * 1024 * 1024, // 5MB
    },
    chatFile: {
      bucket: UploadService.BUCKETS.CHAT_MEDIA,
      folder: "files",
      allowedTypes: [
        "application/pdf",
        "text/plain",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ],
      maxSize: 10 * 1024 * 1024, // 10MB
    },
  }

  static async initializeBuckets() {
    try {
      for (const bucketName of Object.values(UploadService.BUCKETS)) {
        const { data: buckets } = await supabaseAdmin.storage.listBuckets()
        const bucketExists = buckets?.some((bucket) => bucket.name === bucketName)

        if (!bucketExists) {
          const { error } = await supabaseAdmin.storage.createBucket(bucketName, {
            public: false,
            allowedMimeTypes: ["image/*", "application/pdf", "text/*", "application/*"],
            fileSizeLimit: 10 * 1024 * 1024, // 10MB
          })

          if (error) {
            console.error(`Error creating bucket ${bucketName}:`, error)
          } else {
            console.log(`Bucket ${bucketName} created successfully`)
          }
        }
      }
    } catch (error) {
      console.error("Error initializing buckets:", error)
    }
  }

  static async generateSignedUploadUrl(
    uploadType: keyof typeof UploadService.UPLOAD_CONFIGS,
    fileName: string,
    userId: string,
  ) {
    try {
      const config = UploadService.UPLOAD_CONFIGS[uploadType]
      if (!config) {
        throw createError("Invalid upload type", 400)
      }

      // Generate unique filename
      const fileExtension = fileName.split(".").pop()
      const uniqueFileName = `${config.folder}/${userId}/${Date.now()}_${crypto.randomBytes(8).toString("hex")}.${fileExtension}`

      // Generate signed URL for upload
      const { data, error } = await supabaseAdmin.storage.from(config.bucket).createSignedUploadUrl(uniqueFileName)

      if (error) {
        throw createError(`Failed to generate upload URL: ${error.message}`, 500)
      }

      return {
        uploadUrl: data.signedUrl,
        filePath: uniqueFileName,
        bucket: config.bucket,
        config,
      }
    } catch (error) {
      console.error("Error generating signed upload URL:", error)
      throw error
    }
  }

  static async generateSignedDownloadUrl(bucket: string, filePath: string, expiresIn = 3600) {
    try {
      const { data, error } = await supabaseAdmin.storage.from(bucket).createSignedUrl(filePath, expiresIn)

      if (error) {
        throw createError(`Failed to generate download URL: ${error.message}`, 500)
      }

      return data.signedUrl
    } catch (error) {
      console.error("Error generating signed download URL:", error)
      throw error
    }
  }

  static async deleteFile(bucket: string, filePath: string) {
    try {
      const { error } = await supabaseAdmin.storage.from(bucket).remove([filePath])

      if (error) {
        throw createError(`Failed to delete file: ${error.message}`, 500)
      }

      return { success: true }
    } catch (error) {
      console.error("Error deleting file:", error)
      throw error
    }
  }

  static async getFileInfo(bucket: string, filePath: string) {
    try {
      const { data, error } = await supabaseAdmin.storage
        .from(bucket)
        .list(filePath.split("/").slice(0, -1).join("/"), {
          search: filePath.split("/").pop(),
        })

      if (error) {
        throw createError(`Failed to get file info: ${error.message}`, 500)
      }

      return data?.[0] || null
    } catch (error) {
      console.error("Error getting file info:", error)
      throw error
    }
  }

  static async listUserFiles(bucket: string, userId: string, folder?: string) {
    try {
      const path = folder ? `${folder}/${userId}` : userId

      const { data, error } = await supabaseAdmin.storage.from(bucket).list(path)

      if (error) {
        throw createError(`Failed to list files: ${error.message}`, 500)
      }

      return data || []
    } catch (error) {
      console.error("Error listing user files:", error)
      throw error
    }
  }

  // Helper method to validate file before upload
  static validateFile(file: any, uploadType: keyof typeof UploadService.UPLOAD_CONFIGS) {
    const config = UploadService.UPLOAD_CONFIGS[uploadType]
    if (!config) {
      throw createError("Invalid upload type", 400)
    }

    if (!config.allowedTypes.includes(file.mimetype)) {
      throw createError(`File type ${file.mimetype} not allowed for ${uploadType}`, 400)
    }

    if (file.size > config.maxSize) {
      throw createError(`File size exceeds limit of ${config.maxSize / (1024 * 1024)}MB`, 400)
    }

    return true
  }

  // Get public URL for files (if bucket is public)
  static getPublicUrl(bucket: string, filePath: string) {
    const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(filePath)

    return data.publicUrl
  }
}
