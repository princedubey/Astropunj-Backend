import { Router, type IRouter } from "express"
import authRoutes from "./auth"
import astrologerRoutes from "./astrologers"
import paymentRoutes from "./payments"
import walletRoutes from "./wallet"
import chatRoutes from "./chat"
import callRoutes from "./calls"
import adminRoutes from "./admin"
import reviewRoutes from "./reviews"
import notificationRoutes from "./notifications"
import uploadRoutes from "./upload"

const router: IRouter = Router()

// API routes
router.use("/auth", authRoutes)
router.use("/astrologers", astrologerRoutes)
router.use("/payments", paymentRoutes)
router.use("/wallet", walletRoutes)
router.use("/chat", chatRoutes)
router.use("/calls", callRoutes)
router.use("/admin", adminRoutes)
router.use("/reviews", reviewRoutes)
router.use("/notifications", notificationRoutes)
router.use("/upload", uploadRoutes)

export default router