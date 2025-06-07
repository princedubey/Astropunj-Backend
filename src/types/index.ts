export interface User {
  id: string
  email: string
  phone?: string
  name: string
  dob: Date
  gender: string
  language: string
  birthInfo: any
  walletBalance: number
  isBlocked: boolean
  createdAt: Date
}

export interface Astrologer {
  id: string
  userId: string
  bio: string
  experience: number
  expertise: string[]
  languages: string[]
  pricePerMinuteChat: number
  pricePerMinuteCall: number
  available: boolean
  rating: number
  totalReviews: number
}

export interface ChatMessage {
  id: string
  senderId: string
  message: string
  timestamp: Date
  type: "text" | "image" | "file"
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface PaginationQuery {
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  sortOrder?: "asc" | "desc"
}
