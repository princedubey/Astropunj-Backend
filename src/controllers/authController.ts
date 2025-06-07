import type { Request, Response, NextFunction } from "express"
import prisma from "../config/database"
import { supabaseAdmin } from "../config/supabase"
import { createError } from "../middlewares/errorHandler"
import type { AuthenticatedRequest } from "../middlewares/auth"

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, name, phone, dob, gender, language, birthInfo } = req.body

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      })

      if (existingUser) {
        throw createError("User already exists with this email", 400)
      }

      // Create user in database
      const user = await prisma.user.create({
        data: {
          email,
          name,
          phone,
          dob: new Date(dob),
          gender,
          language,
          birthInfo,
        },
      })

      res.status(201).json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            phone: user.phone,
            walletBalance: user.walletBalance,
          },
        },
        message: "User registered successfully",
      })
    } catch (error) {
      next(error)
    }
  }

  static async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          astrologer: true,
        },
      })

      if (!user) {
        throw createError("User not found", 404)
      }

      res.json({
        success: true,
        data: { user },
      })
    } catch (error) {
      next(error)
    }
  }

  static async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!
      const { name, phone, language, birthInfo } = req.body

      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(name && { name }),
          ...(phone && { phone }),
          ...(language && { language }),
          ...(birthInfo && { birthInfo }),
        },
      })

      res.json({
        success: true,
        data: { user },
        message: "Profile updated successfully",
      })
    } catch (error) {
      next(error)
    }
  }

  static async sendOTP(req: Request, res: Response, next: NextFunction) {
    try {
      const { phone } = req.body

      const { error } = await supabaseAdmin.auth.signInWithOtp({
        phone,
        options: {
          channel: "sms",
        },
      })

      if (error) {
        throw createError(error.message, 400)
      }

      res.json({
        success: true,
        message: "OTP sent successfully",
      })
    } catch (error) {
      next(error)
    }
  }

  static async verifyOTP(req: Request, res: Response, next: NextFunction) {
    try {
      const { phone, token } = req.body

      const { data, error } = await supabaseAdmin.auth.verifyOtp({
        phone,
        token,
        type: "sms",
      })

      if (error) {
        throw createError(error.message, 400)
      }

      res.json({
        success: true,
        data: {
          user: data.user,
          session: data.session,
        },
        message: "OTP verified successfully",
      })
    } catch (error) {
      next(error)
    }
  }
}
