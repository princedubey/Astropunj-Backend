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

  static async deleteFile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { bucket, filePath } = req.params
      await UploadService.deleteFile(bucket, filePath)
      res.json({ success: true, message: "File deleted successfully" })
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

  static async updateProfileImage(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!
      const { filePath, bucket } = req.body
      const user = await UploadService.updateProfileImage(userId, filePath, bucket)
      res.json({ success: true, data: { user } })
    } catch (error) {
      next(error)
    }
  }

  static async uploadKundali(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!
      const { filePath, bucket, fileName, fileType } = req.body
      const kundali = await UploadService.uploadKundali(userId, filePath, bucket, fileName, fileType)
      res.json({ success: true, data: { kundali } })
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

  static async deleteKundali(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!
      const { kundaliId } = req.params
      await UploadService.deleteKundali(kundaliId, userId)
      res.json({ success: true, message: "Kundali deleted successfully" })
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
