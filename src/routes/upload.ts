import { Router } from "express"
import { UploadController } from "../controllers/uploadController"
import { authMiddleware } from "../middlewares/auth"
import { validate } from "../middlewares/validation"
import Joi from "joi"

const router = Router()

// Validation schemas
const generateUploadUrlSchema = Joi.object({
  uploadType: Joi.string().valid("profile", "kundali", "chatImage", "chatFile").required(),
  fileName: Joi.string().required(),
})

const updateProfileImageSchema = Joi.object({
  filePath: Joi.string().required(),
  bucket: Joi.string().required(),
})

const uploadKundaliSchema = Joi.object({
  filePath: Joi.string().required(),
  bucket: Joi.string().required(),
  fileName: Joi.string().required(),
  fileType: Joi.string().required(),
})

// Upload URL generation
router.post("/generate-url", authMiddleware, validate(generateUploadUrlSchema), UploadController.generateUploadUrl)

// File management
router.get("/download/:bucket/:filePath(*)", authMiddleware, UploadController.generateDownloadUrl)
router.delete("/:bucket/:filePath(*)", authMiddleware, UploadController.deleteFile)
router.get("/files/:bucket", authMiddleware, UploadController.getUserFiles)
router.get("/info/:bucket/:filePath(*)", authMiddleware, UploadController.getFileInfo)

// Profile image
router.post("/profile-image", authMiddleware, validate(updateProfileImageSchema), UploadController.updateProfileImage)

// Kundali management
router.post("/kundali", authMiddleware, validate(uploadKundaliSchema), UploadController.uploadKundali)
router.get("/kundalis", authMiddleware, UploadController.getUserKundalis)
router.delete("/kundalis/:kundaliId", authMiddleware, UploadController.deleteKundali)

export default router
