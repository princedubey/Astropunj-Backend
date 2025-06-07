import { Router, type IRouter } from "express"
import { WalletController } from "../controllers/walletController"
import { authMiddleware, adminAuthMiddleware } from "../middlewares/auth"
import { validate, validateQuery } from "../middlewares/validation"
import Joi from "joi"

const router: IRouter = Router()

const paginationSchema = Joi.object({
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(50).default(10),
  type: Joi.string().valid("credit", "debit").optional(),
  source: Joi.string().optional(),
})

const creditWalletSchema = Joi.object({
  userId: Joi.string().uuid().required(),
  amount: Joi.number().min(1).required(),
  remarks: Joi.string().required(),
})

const debitWalletSchema = Joi.object({
  userId: Joi.string().uuid().required(),
  amount: Joi.number().min(1).required(),
  remarks: Joi.string().required(),
})

// User routes
router.get("/balance", authMiddleware, WalletController.getBalance)
router.get("/transactions", authMiddleware, validateQuery(paginationSchema), WalletController.getTransactionHistory)
router.get("/transactions/:transactionId", authMiddleware, WalletController.getTransactionById)
router.get("/summary", authMiddleware, WalletController.getWalletSummary)

// Admin routes
router.post("/credit", adminAuthMiddleware, validate(creditWalletSchema), WalletController.creditWallet)
router.post("/debit", adminAuthMiddleware, validate(debitWalletSchema), WalletController.debitWallet)

export default router
