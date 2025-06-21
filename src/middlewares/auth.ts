import type { Request, Response, NextFunction } from "express"
import { supabaseAdmin } from "../config/supabase"
import prisma from "../config/database"
import jwt, { JwtPayload } from "jsonwebtoken"
import { createError } from "./errorHandler"

export interface AuthenticatedRequest extends Request {
  user?: any
  userId?: string
}

interface TokenPayload {
  userId: string
  type: 'access' | 'refresh'
}

export const authMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(" ")[1]
    if (!token) {
      res.status(401).json({ success: false, error: "No token provided" })
      return
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload

    if (decoded.type !== 'access') {
      res.status(401).json({ success: false, error: "Invalid token type" })
      return
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    })

    if (!user) {
      res.status(404).json({ success: false, error: "User not found" })
      return
    }

    if (user.isBlocked) {
      res.status(403).json({ success: false, error: "Account has been blocked" })
      return
    }

    req.userId = decoded.userId
    next()
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ success: false, error: "Invalid token" })
    } else {
      next(error)
    }
  }
}

export const adminAuthMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(" ")[1]
    if (!token) {
      res.status(401).json({ success: false, error: "No token provided" })
      return
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload
    const admin = await prisma.admin.findUnique({
      where: { id: decoded.userId },
    })

    if (!admin) {
      res.status(403).json({ success: false, error: "Not authorized" })
      return
    }

    req.userId = decoded.userId
    next()
  } catch (error) {
    res.status(401).json({ success: false, error: "Invalid token" })
  }
}
