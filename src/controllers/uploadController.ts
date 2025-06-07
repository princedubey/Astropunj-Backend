import type { Response, NextFunction } from "express"
import { UploadService } from "../services/uploadService"
import type { AuthenticatedRequest } from "../middlewares/auth"
import prisma from "../config/database"

export class UploadController {
  static async generateUploadUrl(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!
      const { uploadType, fileName } = req.body

      const result = await UploadService.generateSignedUploadUrl(uploadType, fileName, userId)

      res.json({
        success: true,
        data: result,
        message: "Upload URL generated successfully",
      })
    } catch (error) {
      next(error)
    }
  }

  static async generateDownloadUrl(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { bucket, filePath } = req.params
      const { expiresIn = 3600 } = req.query

      const downloadUrl = await UploadService.generateSignedDownloadUrl(bucket, filePath, Number(expiresIn))

      res.json({
        success: true,
        data: { downloadUrl },
      })
    } catch (error) {
      next(error)
    }
  }

  static async deleteFile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!
      const { bucket, filePath } = req.params

      // Verify user owns the file (check if filePath contains userId)
      if (!filePath.includes(userId)) {
        return res.status(403).json({
          success: false,
          error: "Unauthorized to delete this file",
        })
      }

      await UploadService.deleteFile(bucket, filePath)

      res.json({
        success: true,
        message: "File deleted successfully",
      })
    } catch (error) {
      next(error)
    }
  }

  static async getUserFiles(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!
      const { bucket } = req.params
      const { folder } = req.query

      const files = await UploadService.listUserFiles(bucket, userId, folder as string)

      res.json({
        success: true,
        data: { files },
      })
    } catch (error) {
      next(error)
    }
  }

  static async updateProfileImage(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!
      const { filePath, bucket } = req.body

      // Verify the file belongs to the user
      if (!filePath.includes(userId)) {
        return res.status(403).json({
          success: false,
          error: "Unauthorized file access",
        })
      }

      // Generate public URL or signed URL for the profile image
      const imageUrl = await UploadService.generateSignedDownloadUrl(bucket, filePath, 365 * 24 * 3600) // 1 year

      // Update user profile with new image URL
      await prisma.user.update({
        where: { id: userId },
        data: { profileImage: imageUrl },
      })

      res.json({
        success: true,
        data: { imageUrl },
        message: "Profile image updated successfully",
      })
    } catch (error) {
      next(error)
    }
  }

  static async uploadKundali(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!
      const { filePath, bucket, fileName, fileType } = req.body

      // Verify the file belongs to the user
      if (!filePath.includes(userId)) {
        return res.status(403).json({
          success: false,
          error: "Unauthorized file access",
        })
      }

      // Save kundali information to database
      const kundali = await prisma.kundali.create({
        data: {
          userId,
          fileName,
          filePath,
          bucket,
          fileType,
        },
      })

      res.json({
        success: true,
        data: { kundali },
        message: "Kundali uploaded successfully",
      })
    } catch (error) {
      next(error)
    }
  }

  static async getUserKundalis(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!

      const kundalis = await prisma.kundali.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      })

      // Generate download URLs for each kundali
      const kundalisWithUrls = await Promise.all(
        kundalis.map(async (kundali) => {
          const downloadUrl = await UploadService.generateSignedDownloadUrl(kundali.bucket, kundali.filePath)
          return {
            ...kundali,
            downloadUrl,
          }
        }),
      )

      res.json({
        success: true,
        data: { kundalis: kundalisWithUrls },
      })
    } catch (error) {
      next(error)
    }
  }

  static async deleteKundali(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!
      const { kundaliId } = req.params

      const kundali = await prisma.kundali.findFirst({
        where: { id: kundaliId, userId },
      })

      if (!kundali) {
        return res.status(404).json({
          success: false,
          error: "Kundali not found",
        })
      }

      // Delete file from storage
      await UploadService.deleteFile(kundali.bucket, kundali.filePath)

      // Delete record from database
      await prisma.kundali.delete({
        where: { id: kundaliId },
      })

      res.json({
        success: true,
        message: "Kundali deleted successfully",
      })
    } catch (error) {
      next(error)
    }
  }

  static async getFileInfo(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { bucket, filePath } = req.params

      const fileInfo = await UploadService.getFileInfo(bucket, filePath)

      res.json({
        success: true,
        data: { fileInfo },
      })
    } catch (error) {
      next(error)
    }
  }
}
