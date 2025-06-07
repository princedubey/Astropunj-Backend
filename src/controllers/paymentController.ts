import type { Request, Response, NextFunction } from "express"
import razorpay from "../config/razorpay"
import prisma from "../config/database"
import { WalletService } from "../services/walletService"
import { createError } from "../middlewares/errorHandler"
import type { AuthenticatedRequest } from "../middlewares/auth"
import crypto from "crypto"
import { NotificationService } from "../services/notificationService"

export class PaymentController {
  static async createOrder(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!
      const { amount } = req.body

      if (amount < 100) {
        throw createError("Minimum amount is ₹1", 400)
      }

      const options = {
        amount: amount * 100, // amount in paise
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
        payment_capture: 1,
      }

      const order = await razorpay.orders.create(options)

      // Save payment record
      await prisma.payment.create({
        data: {
          userId,
          razorpayOrderId: order.id,
          amount,
          currency: "INR",
          status: "created",
          receipt: options.receipt,
        },
      })

      res.json({
        success: true,
        data: {
          orderId: order.id,
          amount: order.amount,
          currency: order.currency,
          key: process.env.RAZORPAY_KEY_ID,
        },
      })
    } catch (error) {
      next(error)
    }
  }

  static async verifyPayment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body

      // Verify signature
      const body = razorpay_order_id + "|" + razorpay_payment_id
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
        .update(body.toString())
        .digest("hex")

      if (expectedSignature !== razorpay_signature) {
        throw createError("Invalid payment signature", 400)
      }

      // Get payment details from Razorpay
      const payment = await razorpay.payments.fetch(razorpay_payment_id)

      if (payment.status !== "captured") {
        throw createError("Payment not captured", 400)
      }

      // Update payment record and credit wallet
      await prisma.$transaction(async (tx) => {
        const paymentRecord = await tx.payment.update({
          where: { razorpayOrderId: razorpay_order_id },
          data: {
            razorpayPaymentId: razorpay_payment_id,
            status: "paid",
          },
        })

        // Credit wallet
        await WalletService.creditWallet(
          userId,
          paymentRecord.amount,
          "razorpay",
          `Wallet recharge via Razorpay - ${razorpay_payment_id}`,
        )

        // Send payment success notification
        await NotificationService.sendPaymentSuccessNotification(userId, paymentRecord.amount)
      })

      res.json({
        success: true,
        message: "Payment verified and wallet credited successfully",
      })
    } catch (error) {
      next(error)
    }
  }

  static async getPaymentHistory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!
      const { page = 1, limit = 10 } = req.query
      const skip = (Number(page) - 1) * Number(limit)

      const [payments, total] = await Promise.all([
        prisma.payment.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          skip,
          take: Number(limit),
        }),
        prisma.payment.count({
          where: { userId },
        }),
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

  static async refundPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const { paymentId, amount, reason } = req.body

      const refund = await razorpay.payments.refund(paymentId, {
        amount: amount * 100, // amount in paise
        notes: {
          reason,
        },
      })

      res.json({
        success: true,
        data: { refund },
        message: "Refund initiated successfully",
      })
    } catch (error) {
      next(error)
    }
  }
}
