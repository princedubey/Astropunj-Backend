import type { Request, Response, NextFunction } from "express"
import prisma from "../config/database"
import { WalletService } from "../services/walletService"
import { createError } from "../middlewares/errorHandler"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

export class AdminController {
  // Admin Authentication
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body

      const admin = await prisma.admin.findUnique({
        where: { email, isActive: true },
      })

      if (!admin) {
        throw createError("Invalid credentials", 401)
      }

      const isValidPassword = await bcrypt.compare(password, admin.password)
      if (!isValidPassword) {
        throw createError("Invalid credentials", 401)
      }

      const token = jwt.sign({ adminId: admin.id, email: admin.email, role: admin.role }, process.env.JWT_SECRET!, {
        expiresIn: "24h",
      })

      res.json({
        success: true,
        data: {
          admin: {
            id: admin.id,
            email: admin.email,
            role: admin.role,
          },
          token,
        },
        message: "Login successful",
      })
    } catch (error) {
      next(error)
    }
  }

  // User Management
  static async getAllUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 20, search, isBlocked, sortBy = "createdAt", sortOrder = "desc" } = req.query
      const skip = (Number(page) - 1) * Number(limit)

      const where: any = {}
      if (search) {
        where.OR = [
          { name: { contains: search as string, mode: "insensitive" } },
          { email: { contains: search as string, mode: "insensitive" } },
          { phone: { contains: search as string, mode: "insensitive" } },
        ]
      }

      if (isBlocked !== undefined) {
        where.isBlocked = isBlocked === "true"
      }

      const orderBy: any = {}
      orderBy[sortBy as string] = sortOrder

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          include: {
            astrologer: true,
            _count: {
              select: {
                chats: true,
                calls: true,
                payments: true,
                walletTxns: true,
              },
            },
          },
          orderBy,
          skip,
          take: Number(limit),
        }),
        prisma.user.count({ where }),
      ])

      res.json({
        success: true,
        data: { users },
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

  static async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          astrologer: true,
          chats: {
            include: {
              astrologer: {
                include: { user: { select: { name: true } } },
              },
            },
            orderBy: { startedAt: "desc" },
            take: 5,
          },
          calls: {
            include: {
              astrologer: {
                include: { user: { select: { name: true } } },
              },
            },
            orderBy: { startTime: "desc" },
            take: 5,
          },
          walletTxns: {
            orderBy: { createdAt: "desc" },
            take: 10,
          },
          payments: {
            orderBy: { createdAt: "desc" },
            take: 5,
          },
          reviews: {
            include: {
              astrologer: {
                include: { user: { select: { name: true } } },
              },
            },
            orderBy: { createdAt: "desc" },
            take: 5,
          },
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

  static async blockUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, reason } = req.body

      await prisma.user.update({
        where: { id: userId },
        data: { isBlocked: true },
      })

      res.json({
        success: true,
        message: "User blocked successfully",
      })
    } catch (error) {
      next(error)
    }
  }

  static async unblockUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.body

      await prisma.user.update({
        where: { id: userId },
        data: { isBlocked: false },
      })

      res.json({
        success: true,
        message: "User unblocked successfully",
      })
    } catch (error) {
      next(error)
    }
  }

  // Astrologer Management
  static async getAllAstrologers(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 20, search, available, sortBy = "createdAt", sortOrder = "desc" } = req.query
      const skip = (Number(page) - 1) * Number(limit)

      const where: any = {
        user: {
          isBlocked: false,
        },
      }

      if (search) {
        where.OR = [
          { user: { name: { contains: search as string, mode: "insensitive" } } },
          { user: { email: { contains: search as string, mode: "insensitive" } } },
          { bio: { contains: search as string, mode: "insensitive" } },
        ]
      }

      if (available !== undefined) {
        where.available = available === "true"
      }

      const orderBy: any = {}
      orderBy[sortBy as string] = sortOrder

      const [astrologers, total] = await Promise.all([
        prisma.astrologer.findMany({
          where,
          include: {
            user: true,
            _count: {
              select: {
                chats: true,
                calls: true,
                reviews: true,
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
      const { astrologerId } = req.params

      const astrologer = await prisma.astrologer.findUnique({
        where: { id: astrologerId },
        include: {
          user: true,
          chats: {
            include: {
              user: { select: { name: true, email: true } },
            },
            orderBy: { startedAt: "desc" },
            take: 10,
          },
          calls: {
            include: {
              user: { select: { name: true, email: true } },
            },
            orderBy: { startTime: "desc" },
            take: 10,
          },
          reviews: {
            include: {
              user: { select: { name: true } },
            },
            orderBy: { createdAt: "desc" },
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

  // Financial Management
  static async processRefund(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, amount, reason } = req.body

      await WalletService.creditWallet(userId, amount, "admin", `Admin refund: ${reason}`)

      res.json({
        success: true,
        message: "Refund processed successfully",
      })
    } catch (error) {
      next(error)
    }
  }

  static async getAllPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 20, status, userId } = req.query
      const skip = (Number(page) - 1) * Number(limit)

      const where: any = {}
      if (status) {
        where.status = status as string
      }
      if (userId) {
        where.userId = userId as string
      }

      const [payments, total] = await Promise.all([
        prisma.payment.findMany({
          where,
          include: {
            user: {
              select: { name: true, email: true },
            },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: Number(limit),
        }),
        prisma.payment.count({ where }),
      ])

      res.json({
        success: true,
        data: { payments },
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

  static async getAllWalletTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 20, type, source, userId } = req.query
      const skip = (Number(page) - 1) * Number(limit)

      const where: any = {}
      if (type) {
        where.type = type as string
      }
      if (source) {
        where.source = source as string
      }
      if (userId) {
        where.userId = userId as string
      }

      const [transactions, total] = await Promise.all([
        prisma.walletTransaction.findMany({
          where,
          include: {
            user: {
              select: { name: true, email: true },
            },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: Number(limit),
        }),
        prisma.walletTransaction.count({ where }),
      ])

      res.json({
        success: true,
        data: { transactions },
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

  // Analytics
  static async getDashboardAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const [
        totalUsers,
        totalAstrologers,
        totalChats,
        totalCalls,
        totalRevenue,
        activeUsers,
        onlineAstrologers,
        todayChats,
        todayCalls,
        todayRevenue,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.astrologer.count(),
        prisma.chat.count(),
        prisma.call.count(),
        prisma.payment.aggregate({
          where: { status: "paid" },
          _sum: { amount: true },
        }),
        prisma.user.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
            },
          },
        }),
        prisma.astrologer.count({
          where: { available: true },
        }),
        prisma.chat.count({
          where: {
            startedAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        }),
        prisma.call.count({
          where: {
            startTime: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        }),
        prisma.payment.aggregate({
          where: {
            status: "paid",
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
          _sum: { amount: true },
        }),
      ])

      res.json({
        success: true,
        data: {
          overview: {
            totalUsers,
            totalAstrologers,
            totalChats,
            totalCalls,
            totalRevenue: totalRevenue._sum.amount || 0,
            activeUsers,
            onlineAstrologers,
          },
          today: {
            chats: todayChats,
            calls: todayCalls,
            revenue: todayRevenue._sum.amount || 0,
          },
        },
      })
    } catch (error) {
      next(error)
    }
  }

  static async getRevenueAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const { period = "7d" } = req.query
      let startDate: Date

      switch (period) {
        case "24h":
          startDate = new Date(Date.now() - 24 * 60 * 60 * 1000)
          break
        case "7d":
          startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          break
        case "30d":
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          break
        case "90d":
          startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
          break
        default:
          startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      }

      const [paymentRevenue, chatRevenue, callRevenue] = await Promise.all([
        prisma.payment.aggregate({
          where: {
            status: "paid",
            createdAt: { gte: startDate },
          },
          _sum: { amount: true },
          _count: true,
        }),
        prisma.chat.aggregate({
          where: {
            status: "completed",
            endedAt: { gte: startDate },
          },
          _sum: { chargedAmount: true },
          _count: true,
        }),
        prisma.call.aggregate({
          where: {
            status: "completed",
            endTime: { gte: startDate },
          },
          _sum: { chargedAmount: true },
          _count: true,
        }),
      ])

      res.json({
        success: true,
        data: {
          period,
          revenue: {
            total:
              (paymentRevenue._sum.amount || 0) +
              (chatRevenue._sum.chargedAmount || 0) +
              (callRevenue._sum.chargedAmount || 0),
            payments: paymentRevenue._sum.amount || 0,
            chats: chatRevenue._sum.chargedAmount || 0,
            calls: callRevenue._sum.chargedAmount || 0,
          },
          transactions: {
            payments: paymentRevenue._count,
            chats: chatRevenue._count,
            calls: callRevenue._count,
          },
        },
      })
    } catch (error) {
      next(error)
    }
  }

  // Chat & Call Management
  static async getAllChats(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 20, status, userId, astrologerId } = req.query
      const skip = (Number(page) - 1) * Number(limit)

      const where: any = {}
      if (status) {
        where.status = status as string
      }
      if (userId) {
        where.userId = userId as string
      }
      if (astrologerId) {
        where.astrologerId = astrologerId as string
      }

      const [chats, total] = await Promise.all([
        prisma.chat.findMany({
          where,
          include: {
            user: {
              select: { name: true, email: true },
            },
            astrologer: {
              include: {
                user: {
                  select: { name: true, email: true },
                },
              },
            },
          },
          orderBy: { startedAt: "desc" },
          skip,
          take: Number(limit),
        }),
        prisma.chat.count({ where }),
      ])

      res.json({
        success: true,
        data: { chats },
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

  static async getAllCalls(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 20, status, type, userId, astrologerId } = req.query
      const skip = (Number(page) - 1) * Number(limit)

      const where: any = {}
      if (status) {
        where.status = status as string
      }
      if (type) {
        where.type = type as string
      }
      if (userId) {
        where.userId = userId as string
      }
      if (astrologerId) {
        where.astrologerId = astrologerId as string
      }

      const [calls, total] = await Promise.all([
        prisma.call.findMany({
          where,
          include: {
            user: {
              select: { name: true, email: true },
            },
            astrologer: {
              include: {
                user: {
                  select: { name: true, email: true },
                },
              },
            },
          },
          orderBy: { startTime: "desc" },
          skip,
          take: Number(limit),
        }),
        prisma.call.count({ where }),
      ])

      res.json({
        success: true,
        data: { calls },
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

  // Reviews Management
  static async getAllReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 20, rating, astrologerId, userId } = req.query
      const skip = (Number(page) - 1) * Number(limit)

      const where: any = {}
      if (rating) {
        where.rating = Number(rating)
      }
      if (astrologerId) {
        where.astrologerId = astrologerId as string
      }
      if (userId) {
        where.userId = userId as string
      }

      const [reviews, total] = await Promise.all([
        prisma.review.findMany({
          where,
          include: {
            user: {
              select: { name: true, email: true },
            },
            astrologer: {
              include: {
                user: {
                  select: { name: true, email: true },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: Number(limit),
        }),
        prisma.review.count({ where }),
      ])

      res.json({
        success: true,
        data: { reviews },
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

  static async deleteReview(req: Request, res: Response, next: NextFunction) {
    try {
      const { reviewId } = req.params

      const review = await prisma.review.findUnique({
        where: { id: reviewId },
      })

      if (!review) {
        throw createError("Review not found", 404)
      }

      await prisma.review.delete({
        where: { id: reviewId },
      })

      // Update astrologer rating
      const reviews = await prisma.review.findMany({
        where: { astrologerId: review.astrologerId },
        select: { rating: true },
      })

      if (reviews.length > 0) {
        const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length

        await prisma.astrologer.update({
          where: { id: review.astrologerId },
          data: {
            rating: Math.round(avgRating * 10) / 10,
            totalReviews: reviews.length,
          },
        })
      } else {
        await prisma.astrologer.update({
          where: { id: review.astrologerId },
          data: {
            rating: 0,
            totalReviews: 0,
          },
        })
      }

      res.json({
        success: true,
        message: "Review deleted successfully",
      })
    } catch (error) {
      next(error)
    }
  }
}
