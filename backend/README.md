# Backend - Estilo Latino Dance Studio API

This is the backend API for the Estilo Latino Dance Studio management system.

## Prerequisites

- Node.js 18+
- Supabase account (for database and storage)
- Square Developer account (for payments)
- Resend account (for emails)
- Twilio account (for SMS)

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` with your actual credentials.

3. **Set up Supabase database:**
   - Create a new Supabase project at https://supabase.com
   - Go to SQL Editor
   - Copy the contents of `src/database/schema.sql` and run it
   - Copy your project URL and keys to `.env`

4. **Run in development:**
   ```bash
   npm run dev
   ```

## API Endpoints

### Auth
- `POST /api/auth/register` - Register new customer
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users` - List all customers (admin)
- `GET /api/users/search?query=` - Search users (staff/admin)
- `GET /api/users/qr/:qrCode` - Find by QR code (staff/admin)
- `GET /api/users/:userId` - Get user
- `PUT /api/users/:userId` - Update user
- `DELETE /api/users/:userId` - Delete user (admin)
- `GET /api/users/:userId/family-members` - Get family members
- `POST /api/users/:userId/family-members` - Add family member

### Punch Cards
- `GET /api/cards/types` - Get available card types
- `GET /api/cards/user/:userId` - Get user's cards
- `GET /api/cards/active/user/:userId` - Get active card
- `POST /api/cards/admin-create` - Create pass (admin)
- `GET /api/cards/expired` - Get expired cards (admin)

### Check-Ins
- `POST /api/checkins` - Check in customer (staff/admin)
- `GET /api/checkins/today` - Today's check-ins (staff/admin)
- `GET /api/checkins/history` - All check-ins (staff/admin)
- `GET /api/checkins/user/:userId` - User's check-in history

### Analytics (Admin Only)
- `GET /api/analytics/dashboard` - Dashboard stats
- `GET /api/analytics/revenue` - Revenue by card type
- `GET /api/analytics/attendance` - Attendance trends
- `GET /api/analytics/monthly` - Monthly analytics

## Development

```bash
# Run in development mode with hot reload
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

## Environment Variables

See `.env.example` for all required environment variables.
