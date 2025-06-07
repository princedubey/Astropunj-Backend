# AstroPunj Backend

A robust backend API for the AstroPunj astrology platform, built with Node.js, Express, TypeScript, and Prisma.

## 🚀 Features

- **Authentication & Authorization**
  - JWT-based authentication
  - Role-based access control (User, Astrologer, Admin)
  - Phone OTP verification

- **Astrologer Management**
  - Astrologer onboarding and profile management
  - Expertise and language management
  - Availability tracking
  - Rating and review system

- **Communication**
  - Real-time chat system
  - Voice and video calls using Agora
  - Push notifications
  - Email notifications

- **Payment Integration**
  - Razorpay payment gateway
  - Wallet system
  - Transaction history
  - Refund management

- **File Management**
  - Secure file uploads using Supabase Storage
  - Kundali document management
  - Profile image handling
  - Chat media storage

## 🛠 Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** Supabase Auth
- **Storage:** Supabase Storage
- **Payment:** Razorpay
- **Real-time Communication:** Agora
- **API Documentation:** Swagger/OpenAPI

## 📋 Prerequisites

- Node.js (v16 or higher)
- PostgreSQL
- pnpm (recommended) or npm
- Supabase account
- Razorpay account
- Agora account

## 🔧 Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/astropunj"

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Razorpay
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Agora
AGORA_APP_ID=your_agora_app_id
AGORA_APP_CERTIFICATE=your_agora_app_certificate

# JWT
JWT_SECRET=your_jwt_secret

# Frontend
FRONTEND_URL=http://localhost:3000
```

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/astropunj-backend.git
   cd astropunj-backend
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up the database**
   ```bash
   pnpm db:generate
   pnpm db:push
   ```

4. **Start the development server**
   ```bash
   pnpm dev
   ```

## 📚 API Documentation

The API documentation is available at `/api-docs` when running the server.

### Main Endpoints

- `/api/auth` - Authentication endpoints
- `/api/astrologers` - Astrologer management
- `/api/chat` - Chat system
- `/api/calls` - Voice and video calls
- `/api/payments` - Payment processing
- `/api/wallet` - Wallet management
- `/api/notifications` - Notification system
- `/api/upload` - File uploads

## 🧪 Testing

```bash
# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage
```

## 📦 Deployment

1. **Build the project**
   ```bash
   pnpm build
   ```

2. **Start production server**
   ```bash
   pnpm start
   ```

## 🔐 Security

- Rate limiting on sensitive endpoints
- CORS configuration
- Helmet for security headers
- Input validation using Joi
- SQL injection prevention with Prisma
- XSS protection
- Secure file uploads

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- Prince Dubey - Sr. Software Developer
- [Webiste](https://princedubey.com/)


## 🙏 Acknowledgments

- [Express.js](https://expressjs.com/)
- [Prisma](https://www.prisma.io/)
- [Supabase](https://supabase.io/)
- [Razorpay](https://razorpay.com/)
- [Agora](https://www.agora.io/)
