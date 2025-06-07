import type { Request, Response, NextFunction } from "express"
import { WalletService } from "../services/walletService"
import type { AuthenticatedRequest } from "../middlewares/auth"

export class WalletController {
  static async getBalance(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!
      const balance = await WalletService.getBalance(userId)

      res.json({
        success: true,
        data: { balance },
      })
    } catch (error) {
      next(error)
    }
  }

  static async getTransactionHistory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!
      const { page = 1, limit = 10, type, source } = req.query

      const result = await WalletService.getTransactionHistory(
        userId,
        Number(page),
        Number(limit),
        type as string,
        source as string,
      )

      res.json({
        success: true,
        data: result.transactions,
        pagination: result.pagination,
      })
    } catch (error) {
      next(error)
    }
  }

  static async getTransactionById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!
      const { transactionId } = req.params

      const transaction = await WalletService.getTransactionById(transactionId, userId)

      res.json({
        success: true,
        data: { transaction },
      })
    } catch (error) {
      next(error)
    }
  }

  static async getWalletSummary(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!

      const summary = await WalletService.getWalletSummary(userId)

      res.json({
        success: true,
        data: { summary },
      })
    } catch (error) {
      next(error)
    }
  }

  // Admin only - Credit wallet manually
  static async creditWallet(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, amount, remarks } = req.body

      await WalletService.creditWallet(userId, amount, "admin", remarks)

      res.json({
        success: true,
        message: "Wallet credited successfully",
      })
    } catch (error) {
      next(error)
    }
  }

  // Admin only - Debit wallet manually
  static async debitWallet(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, amount, remarks } = req.body

      await WalletService.debitWallet(userId, amount, "admin", remarks)

      res.json({
        success: true,
        message: "Wallet debited successfully",
      })
    } catch (error) {
      next(error)
    }
  }
}
