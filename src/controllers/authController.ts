import type { Request, Response, NextFunction } from "express"
import prisma from "../config/database"
import { supabaseAdmin } from "../config/supabase"
import { createError } from "../middlewares/errorHandler"
import type { AuthenticatedRequest } from "../middlewares/auth"
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"

interface TokenPayload {
  userId: string
  type: 'access' | 'refresh'
}

export class AuthController {
  private static generateTokens(userId: string) {
    const accessToken = jwt.sign(
      { userId, type: 'access' } as TokenPayload,
      process.env.JWT_SECRET!,
      { expiresIn: '15m' } // Access token expires in 15 minutes
    )

    const refreshToken = jwt.sign(
      { userId, type: 'refresh' } as TokenPayload,
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: '7d' } // Refresh token expires in 7 days
    )

    return { accessToken, refreshToken }
  }

  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, name, phone, dob, gender, language, birthInfo, password } = req.body

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      })

      if (existingUser) {
        throw createError("User already exists with this email", 400)
      }

      // Hash password
      const salt = await bcrypt.genSalt(10)
      const hashedPassword = await bcrypt.hash(password, salt)

      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.signUp({
        email,
        password: hashedPassword,
        phone,
      })

      if (authError) {
        throw createError(authError.message, 400)
      }

      // Create user in database
      const user = await prisma.user.create({
        data: {
          email,
          name,
          phone,
          password: hashedPassword,
          dob: new Date(dob),
          gender,
          language,
          birthInfo,
        },
      })

      // Generate tokens
      const { accessToken, refreshToken } = this.generateTokens(user.id)

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
          accessToken,
          refreshToken,
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

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body

      if (!email) {
        throw createError("Email or phone is required", 400)
      }

      // Find user in database
      const user = await prisma.user.findUnique({
        where: email,
        include: {
          astrologer: true,
        },
      })

      if (!user) {
        throw createError("Invalid credentials", 401)
      }

      if (user.isBlocked) {
        throw createError("Account has been blocked", 403)
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password)
      if (!isPasswordValid) {
        throw createError("Invalid credentials", 401)
      }

      // Generate tokens
      const { accessToken, refreshToken } = this.generateTokens(user.id)

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            phone: user.phone,
            walletBalance: user.walletBalance,
            astrologer: user.astrologer,
          },
          accessToken,
          refreshToken,
        },
        message: "Login successful",
      })
    } catch (error) {
      next(error)
    }
  }

  static async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body

      if (!refreshToken) {
        throw createError("Refresh token is required", 400)
      }

      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as TokenPayload

      if (decoded.type !== 'refresh') {
        throw createError("Invalid token type", 401)
      }

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      })

      if (!user) {
        throw createError("User not found", 404)
      }

      if (user.isBlocked) {
        throw createError("Account has been blocked", 403)
      }

      // Generate new tokens
      const tokens = this.generateTokens(user.id)

      res.json({
        success: true,
        data: tokens,
        message: "Tokens refreshed successfully",
      })
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        next(createError("Invalid refresh token", 401))
      } else {
        next(error)
      }
    }
  }
}
