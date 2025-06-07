import type { Request, Response, NextFunction } from "express"
import prisma from "../config/database"
import { createError } from "../middlewares/errorHandler"
import type { AuthenticatedRequest } from "../middlewares/auth"
import { NotificationService } from "../services/notificationService"

export class ReviewController {
  static async createReview(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!
      const { astrologerId, rating, review, serviceType, serviceId } = req.body

      // Check if service exists and belongs to user
      const serviceExists =
        serviceType === "chat"
          ? await prisma.chat.findFirst({
              where: { id: serviceId, userId, astrologerId, status: "completed" },
            })
          : await prisma.call.findFirst({
              where: { id: serviceId, userId, astrologerId, status: "completed" },
            })

      if (!serviceExists) {
        throw createError("Service not found or not completed", 400)
      }

      // Check if review already exists
      const existingReview = await prisma.review.findFirst({
        where: { userId, astrologerId, serviceId },
      })

      if (existingReview) {
        throw createError("Review already exists for this service", 400)
      }

      // Create review
      const newReview = await prisma.review.create({
        data: {
          userId,
          astrologerId,
          rating,
          review,
          serviceType,
          serviceId,
        },
        include: {
          user: {
            select: { name: true },
          },
        },
      })

      // Update astrologer rating
      await ReviewController.updateAstrologerRating(astrologerId)

      // Send notification to astrologer
      await NotificationService.sendReviewReceivedNotification(astrologerId, newReview.user.name, rating)

      res.status(201).json({
        success: true,
        data: { review: newReview },
        message: "Review created successfully",
      })
    } catch (error) {
      next(error)
    }
  }

  static async getReviewsForAstrologer(req: Request, res: Response, next: NextFunction) {
    try {
      const { astrologerId } = req.params
      const { page = 1, limit = 10, rating } = req.query
      const skip = (Number(page) - 1) * Number(limit)

      const where: any = { astrologerId }
      if (rating) {
        where.rating = Number(rating)
      }

      const [reviews, total] = await Promise.all([
        prisma.review.findMany({
          where,
          include: {
            user: {
              select: { name: true },
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

  static async getUserReviews(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!
      const { page = 1, limit = 10 } = req.query
      const skip = (Number(page) - 1) * Number(limit)

      const [reviews, total] = await Promise.all([
        prisma.review.findMany({
          where: { userId },
          include: {
            astrologer: {
              include: {
                user: {
                  select: { name: true },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: Number(limit),
        }),
        prisma.review.count({ where: { userId } }),
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

  static async updateReview(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!
      const { reviewId } = req.params
      const { rating, review } = req.body

      const existingReview = await prisma.review.findFirst({
        where: { id: reviewId, userId },
      })

      if (!existingReview) {
        throw createError("Review not found", 404)
      }

      const updatedReview = await prisma.review.update({
        where: { id: reviewId },
        data: {
          ...(rating && { rating }),
          ...(review && { review }),
        },
        include: {
          user: {
            select: { name: true },
          },
        },
      })

      // Update astrologer rating
      await ReviewController.updateAstrologerRating(existingReview.astrologerId)

      res.json({
        success: true,
        data: { review: updatedReview },
        message: "Review updated successfully",
      })
    } catch (error) {
      next(error)
    }
  }

  static async deleteReview(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!
      const { reviewId } = req.params

      const existingReview = await prisma.review.findFirst({
        where: { id: reviewId, userId },
      })

      if (!existingReview) {
        throw createError("Review not found", 404)
      }

      await prisma.review.delete({
        where: { id: reviewId },
      })

      // Update astrologer rating
      await ReviewController.updateAstrologerRating(existingReview.astrologerId)

      res.json({
        success: true,
        message: "Review deleted successfully",
      })
    } catch (error) {
      next(error)
    }
  }

  static async getReviewStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { astrologerId } = req.params

      const stats = await prisma.review.groupBy({
        by: ["rating"],
        where: { astrologerId },
        _count: {
          rating: true,
        },
      })

      const totalReviews = await prisma.review.count({
        where: { astrologerId },
      })

      const avgRating = await prisma.review.aggregate({
        where: { astrologerId },
        _avg: {
          rating: true,
        },
      })

      res.json({
        success: true,
        data: {
          stats,
          totalReviews,
          averageRating: avgRating._avg.rating || 0,
        },
      })
    } catch (error) {
      next(error)
    }
  }

  // Helper method to update astrologer rating
  private static async updateAstrologerRating(astrologerId: string) {
    const reviews = await prisma.review.findMany({
      where: { astrologerId },
      select: { rating: true },
    })

    if (reviews.length > 0) {
      const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length

      await prisma.astrologer.update({
        where: { id: astrologerId },
        data: {
          rating: Math.round(avgRating * 10) / 10,
          totalReviews: reviews.length,
        },
      })
    }
  }
}
