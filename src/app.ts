import express, { Application } from "express"
import cors from "cors"
import 'dotenv/config'
import helmet from "helmet"
import morgan from "morgan"
import { errorHandler } from "./middlewares/errorHandler"
import { generalLimiter } from "./middlewares/rateLimiter"
import { UploadService } from "./services/uploadService"
import routes from "./routes"

const app: Application = express()

// Security middleware
app.use(helmet())
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
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
app.use("/api", routes)

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  })
})

// Error handling middleware
app.use(errorHandler)

// Only start the server if not running on Vercel
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000
  app.listen(PORT, () => {
    console.log(`🚀 AstroPunj Backend running on port ${PORT}`)
    console.log(`📊 Health check: http://localhost:${PORT}/health`)
  })
}

export default app
