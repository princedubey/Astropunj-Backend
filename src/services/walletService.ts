import prisma from "../config/database"
import { createError } from "../middlewares/errorHandler"

export class WalletService {
  static async getBalance(userId: string): Promise<number> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { walletBalance: true },
    })

    return user?.walletBalance || 0
  }

  static async creditWallet(userId: string, amount: number, source: string, remarks: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      // Update user wallet balance
      const user = await tx.user.update({
        where: { id: userId },
        data: {
          walletBalance: {
            increment: amount,
          },
        },
      })

      // Create transaction record
      await tx.walletTransaction.create({
        data: {
          userId,
          type: "credit",
          source,
          amount,
          remarks,
          balanceAfter: user.walletBalance,
        },
      })
    })
  }

  static async debitWallet(userId: string, amount: number, source: string, remarks: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      // Check current balance
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { walletBalance: true },
      })

      if (!user || user.walletBalance < amount) {
        throw createError("Insufficient wallet balance", 400)
      }

      // Update user wallet balance
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          walletBalance: {
            decrement: amount,
          },
        },
      })

      // Create transaction record
      await tx.walletTransaction.create({
        data: {
          userId,
          type: "debit",
          source,
          amount,
          remarks,
          balanceAfter: updatedUser.walletBalance,
        },
      })
    })
  }

  static async getTransactionHistory(userId: string, page = 1, limit = 10, type?: string, source?: string) {
    const skip = (page - 1) * limit

    const where: any = { userId }
    if (type) {
      where.type = type
    }
    if (source) {
      where.source = source
    }

    const [transactions, total] = await Promise.all([
      prisma.walletTransaction.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.walletTransaction.count({
        where,
      }),
    ])

    return {
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  static async getTransactionById(transactionId: string, userId: string) {
    const transaction = await prisma.walletTransaction.findFirst({
      where: {
        id: transactionId,
        userId,
      },
    })

    if (!transaction) {
      throw createError("Transaction not found", 404)
    }

    return transaction
  }

  static async getWalletSummary(userId: string) {
    const [balance, totalCredits, totalDebits, recentTransactions] = await Promise.all([
      WalletService.getBalance(userId),
      prisma.walletTransaction.aggregate({
        where: { userId, type: "credit" },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.walletTransaction.aggregate({
        where: { userId, type: "debit" },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.walletTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ])

    return {
      currentBalance: balance,
      totalCredits: totalCredits._sum.amount || 0,
      totalDebits: totalDebits._sum.amount || 0,
      totalCreditTransactions: totalCredits._count,
      totalDebitTransactions: totalDebits._count,
      recentTransactions,
    }
  }
}
