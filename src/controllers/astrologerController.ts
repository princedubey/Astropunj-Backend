import type { Request, Response, NextFunction } from "express"
import prisma from "../config/database"
import { createError } from "../middlewares/errorHandler"
import type { AuthenticatedRequest } from "../middlewares/auth"

export class AstrologerController {
  static async onboard(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!
      const { bio, experience, expertise, languages, pricePerMinuteChat, pricePerMinuteCall } = req.body

      // Check if user is already an astrologer
      const existingAstrologer = await prisma.astrologer.findUnique({
        where: { userId },
      })

      if (existingAstrologer) {
        throw createError("User is already registered as an astrologer", 400)
      }

      const astrologer = await prisma.astrologer.create({
        data: {
          userId,
          bio,
          experience,
          expertise,
          languages,
          pricePerMinuteChat,
          pricePerMinuteCall,
        },
        include: {
          user: true,
        },
      })

      res.status(201).json({
        success: true,
        data: { astrologer },
        message: "Astrologer onboarded successfully",
      })
    } catch (error) {
      next(error)
    }
  }

  static async getAstrologers(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        expertise,
        language,
        available,
        minPrice,
        maxPrice,
        sortBy = "rating",
        sortOrder = "desc",
      } = req.query

      const skip = (Number(page) - 1) * Number(limit)

      const where: any = {
        user: {
          isBlocked: false,
        },
      }

      if (search) {
        where.OR = [
          { user: { name: { contains: search as string, mode: "insensitive" } } },
          { bio: { contains: search as string, mode: "insensitive" } },
        ]
      }

      if (expertise) {
        where.expertise = {
          has: expertise as string,
        }
      }

      if (language) {
        where.languages = {
          has: language as string,
        }
      }

      if (available !== undefined) {
        where.available = available === "true"
      }

      if (minPrice || maxPrice) {
        where.pricePerMinuteChat = {}
        if (minPrice) where.pricePerMinuteChat.gte = Number(minPrice)
        if (maxPrice) where.pricePerMinuteChat.lte = Number(maxPrice)
      }

      const orderBy: any = {}
      if (sortBy === "rating") {
        orderBy.rating = sortOrder
      } else if (sortBy === "price") {
        orderBy.pricePerMinuteChat = sortOrder
      } else if (sortBy === "experience") {
        orderBy.experience = sortOrder
      }

      const [astrologers, total] = await Promise.all([
        prisma.astrologer.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy,
          skip,
          take: Number(limit),
        }),
        prisma.astrologer.count({ where }),
      ])

      res.json({
        success: true,
        data: { astrologers },
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      })
    } catch (error) {
      next(error)
    }
  }

  static async getAstrologerById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params

      const astrologer = await prisma.astrologer.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          reviews: {
            include: {
              user: {
                select: {
                  name: true,
                },
              },
            },
            orderBy: {
              createdAt: "desc",
            },
            take: 10,
          },
        },
      })

      if (!astrologer) {
        throw createError("Astrologer not found", 404)
      }

      res.json({
        success: true,
        data: { astrologer },
      })
    } catch (error) {
      next(error)
    }
  }

  static async updateAvailability(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!
      const { available } = req.body

      const astrologer = await prisma.astrologer.findUnique({
        where: { userId },
      })

      if (!astrologer) {
        throw createError("Astrologer profile not found", 404)
      }

      await prisma.astrologer.update({
        where: { userId },
        data: { available },
      })

      res.json({
        success: true,
        message: `Availability updated to ${available ? "online" : "offline"}`,
      })
    } catch (error) {
      next(error)
    }
  }

  static async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!
      const { bio, expertise, languages, pricePerMinuteChat, pricePerMinuteCall } = req.body

      const astrologer = await prisma.astrologer.update({
        where: { userId },
        data: {
          ...(bio && { bio }),
          ...(expertise && { expertise }),
          ...(languages && { languages }),
          ...(pricePerMinuteChat && { pricePerMinuteChat }),
          ...(pricePerMinuteCall && { pricePerMinuteCall }),
        },
        include: {
          user: true,
        },
      })

      res.json({
        success: true,
        data: { astrologer },
        message: "Profile updated successfully",
      })
    } catch (error) {
      next(error)
    }
  }
}
