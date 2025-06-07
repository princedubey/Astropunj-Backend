import express from "express"
import cors from "cors"
import helmet from "helmet"
import morgan from "morgan"
import { errorHandler } from "./middlewares/errorHandler"
import { generalLimiter } from "./middlewares/rateLimiter"
import { UploadService } from "./services/uploadService"

// Import routes
import authRoutes from "./routes/auth"
import astrologerRoutes from "./routes/astrologers"
import paymentRoutes from "./routes/payments"
import walletRoutes from "./routes/wallet"
import chatRoutes from "./routes/chat"
import callRoutes from "./routes/calls"
import adminRoutes from "./routes/admin"
import reviewRoutes from "./routes/reviews"
import notificationRoutes from "./routes/notifications"
import uploadRoutes from "./routes/upload"

const app = express()

// Security middleware
app.use(helmet())
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
)

// Rate limiting
app.use(generalLimiter)

// Body parsing middleware
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

// Logging
app.use(morgan("combined"))

// Initialize storage buckets
UploadService.initializeBuckets()

// Health check
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "AstroPunj Backend is running",
    timestamp: new Date().toISOString(),
  })
})

// API routes
app.use("/api/auth", authRoutes)
app.use("/api/astrologers", astrologerRoutes)
app.use("/api/payments", paymentRoutes)
app.use("/api/wallet", walletRoutes)
app.use("/api/chat", chatRoutes)
app.use("/api/calls", callRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api/reviews", reviewRoutes)
app.use("/api/notifications", notificationRoutes)
app.use("/api/upload", uploadRoutes)

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  })
})

// Error handling middleware
app.use(errorHandler)

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`🚀 AstroPunj Backend running on port ${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/health`)
})

export default app
