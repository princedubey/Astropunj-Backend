import type { Request, Response, NextFunction } from "express"

export interface CustomError extends Error {
  statusCode?: number
  isOperational?: boolean
}

export const errorHandler = (err: CustomError, req: Request, res: Response, next: NextFunction) => {
  console.error("Error:", {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
  })

  const statusCode = err.statusCode || 500
  const message = err.isOperational ? err.message : "Internal server error"

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  })
}

export const createError = (message: string, statusCode = 500): CustomError => {
  const error = new Error(message) as CustomError
  error.statusCode = statusCode
  error.isOperational = true
  return error
}
