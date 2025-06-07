import rateLimit from "express-rate-limit"

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: "Too many requests, please try again later",
  },
})

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth requests per windowMs
  message: {
    success: false,
    error: "Too many authentication attempts, please try again later",
  },
})

export const paymentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3, // limit each IP to 3 payment requests per minute
  message: {
    success: false,
    error: "Too many payment requests, please try again later",
  },
})

export const agoraTokenLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 token requests per minute
  message: {
    success: false,
    error: "Too many token requests, please try again later",
  },
})
