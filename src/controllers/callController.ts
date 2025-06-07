import type { Response, NextFunction } from "express"
import { CallService } from "../services/callService"
import type { AuthenticatedRequest } from "../middlewares/auth"

export class CallController {
  static async initiateCall(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!
      const { astrologerId, type } = req.body

      const result = await CallService.initiateCall(userId, astrologerId, type)

      res.status(201).json({
        success: true,
        data: result,
        message: "Call initiated successfully",
      })
    } catch (error) {
      next(error)
    }
  }

  static async acceptCall(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!
      const { callId } = req.params

      const result = await CallService.acceptCall(callId, userId)

      res.json({
        success: true,
        data: result,
        message: "Call accepted successfully",
      })
    } catch (error) {
      next(error)
    }
  }

  static async rejectCall(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!
      const { callId } = req.params

      const result = await CallService.rejectCall(callId, userId)

      res.json({
        success: true,
        data: result,
        message: "Call rejected successfully",
      })
    } catch (error) {
      next(error)
    }
  }

  static async endCall(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!
      const { callId } = req.params

      const result = await CallService.endCall(callId, userId)

      res.json({
        success: true,
        data: result,
        message: "Call ended successfully",
      })
    } catch (error) {
      next(error)
    }
  }

  static async getCallHistory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!
      const { page = 1, limit = 10 } = req.query

      const result = await CallService.getCallHistory(userId, Number(page), Number(limit))

      res.json({
        success: true,
        data: result.calls,
        pagination: result.pagination,
      })
    } catch (error) {
      next(error)
    }
  }

  static async getCallById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!
      const { callId } = req.params

      const call = await CallService.getCallById(callId, userId)

      res.json({
        success: true,
        data: { call },
      })
    } catch (error) {
      next(error)
    }
  }

  static async generateAgoraToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!
      const { callId } = req.params

      const result = await CallService.generateAgoraToken(callId, userId)

      res.json({
        success: true,
        data: result,
      })
    } catch (error) {
      next(error)
    }
  }

  static async updateCallStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!
      const { callId } = req.params
      const { status } = req.body

      const result = await CallService.updateCallStatus(callId, userId, status)

      res.json({
        success: true,
        data: result,
        message: "Call status updated successfully",
      })
    } catch (error) {
      next(error)
    }
  }
}
