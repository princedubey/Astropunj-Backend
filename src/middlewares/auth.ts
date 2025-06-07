import type { Request, Response, NextFunction } from "express"
import { supabaseAdmin } from "../config/supabase"
import prisma from "../config/database"

export interface AuthenticatedRequest extends Request {
  user?: any
  userId?: string
}

export const authMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "Authorization token required",
      })
    }

    const token = authHeader.substring(7)

    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token)

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: "Invalid or expired token",
      })
    }

    // Get user from database
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email! },
      include: {
        astrologer: true,
      },
    })

    if (!dbUser) {
      return res.status(404).json({
        success: false,
        error: "User not found in database",
      })
    }

    if (dbUser.isBlocked) {
      return res.status(403).json({
        success: false,
        error: "Account has been blocked",
      })
    }

    req.user = dbUser
    req.userId = dbUser.id
    next()
  } catch (error) {
    console.error("Auth middleware error:", error)
    res.status(500).json({
      success: false,
      error: "Authentication failed",
    })
  }
}

export const adminAuthMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "Authorization token required",
      })
    }

    const token = authHeader.substring(7)

    // For admin, we'll use a simple JWT approach or admin-specific auth
    // This is a simplified version - in production, implement proper admin JWT
    const admin = await prisma.admin.findFirst({
      where: {
        isActive: true,
        // Add your admin token validation logic here
      },
    })

    if (!admin) {
      return res.status(401).json({
        success: false,
        error: "Invalid admin credentials",
      })
    }

    req.user = admin
    next()
  } catch (error) {
    console.error("Admin auth middleware error:", error)
    res.status(500).json({
      success: false,
      error: "Admin authentication failed",
    })
  }
}
