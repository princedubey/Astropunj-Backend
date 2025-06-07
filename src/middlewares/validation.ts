import { Request, Response, NextFunction } from "express"
import Joi from "joi"

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body)
    if (error) {
      res.status(400).json({
        success: false,
        error: error.details[0].message,
      })
      return
    }
    next()
  }
}

export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.query)
    if (error) {
      res.status(400).json({
        success: false,
        error: error.details[0].message,
      })
      return
    }
    next()
  }
}

// Common validation schemas
export const userRegistrationSchema = Joi.object({
  email: Joi.string().email().required(),
  name: Joi.string().min(2).max(50).required(),
  phone: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .optional(),
  dob: Joi.date().max("now").required(),
  gender: Joi.string().valid("male", "female", "other").required(),
  language: Joi.string().required(),
  birthInfo: Joi.object({
    time: Joi.string().required(),
    place: Joi.string().required(),
    coordinates: Joi.object({
      lat: Joi.number().required(),
      lng: Joi.number().required(),
    }).required(),
  }).required(),
})

export const astrologerOnboardingSchema = Joi.object({
  bio: Joi.string().min(50).max(500).required(),
  experience: Joi.number().min(0).max(50).required(),
  expertise: Joi.array().items(Joi.string()).min(1).required(),
  languages: Joi.array().items(Joi.string()).min(1).required(),
  pricePerMinuteChat: Joi.number().min(1).max(1000).required(),
  pricePerMinuteCall: Joi.number().min(1).max(1000).required(),
})

export const paginationSchema = Joi.object({
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(10),
  search: Joi.string().optional(),
  sortBy: Joi.string().optional(),
  sortOrder: Joi.string().valid("asc", "desc").default("desc"),
})
