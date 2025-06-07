import type { Request, Response, NextFunction } from "express"
import { supabaseAdmin } from "../config/supabase"
import prisma from "../config/database"
import jwt, { JwtPayload } from "jsonwebtoken"

export interface AuthenticatedRequest extends Request {
  user?: any
  userId?: string
}

export const authMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(" ")[1]
    if (!token) {
      res.status(401).json({ success: false, error: "No token provided" })
      return
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload
    req.userId = decoded.userId
    next()
  } catch (error) {
    res.status(401).json({ success: false, error: "Invalid token" })
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
