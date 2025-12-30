# Estilo Latino Dance Studio - Punch Card Management System

## 📋 Project Overview

A full-stack web application for managing dance studio punch cards, payments, check-ins, and customer management. The system allows customers to sign up, purchase punch cards online, and check in to classes using QR codes or 4-digit codes.

**Live URLs:**
- Frontend: `https://payments.estilolatinodance.com`
- Backend API: `https://estilolatinodancecompany-production.up.railway.app`

---

## 🛠 Technology Stack

### Frontend
| Technology | Purpose | Why Chosen |
|------------|---------|------------|
| **React 18** | UI Framework | Component-based architecture, excellent ecosystem, team familiarity |
| **TypeScript** | Type Safety | Catches errors at compile time, better IDE support, self-documenting code |
| **Vite** | Build Tool | Lightning-fast HMR, modern ES modules, superior to Create React App |
| **CSS (Vanilla)** | Styling | Maximum flexibility, no framework lock-in, custom design system |
| **Square Web Payments SDK** | Payment UI | Official SDK for PCI-compliant card tokenization |

### Backend
| Technology | Purpose | Why Chosen |
|------------|---------|------------|
| **Node.js + Express** | API Server | Fast, non-blocking I/O, JavaScript full-stack |
| **TypeScript** | Type Safety | Consistent typing with frontend, better maintainability |
| **Supabase** | Database + Auth | PostgreSQL with real-time, built-in auth, generous free tier |
| **Square API** | Payment Processing | Reliable payment gateway, transparent pricing, easy integration |
| **Resend** | Email Service | Works with cloud providers (Railway), simple API, generous free tier |
| **Twilio** | SMS Notifications | Industry standard for SMS, reliable delivery |
| **PDFKit** | PDF Generation | Native Node.js PDF creation for waiver PDFs |

### Infrastructure
| Service | Purpose |
|---------|---------|
| **Railway** | Hosting for frontend and backend (auto-deploys from GitHub) |
| **Supabase** | PostgreSQL database + file storage (waiver PDFs) |
| **GitHub** | Source control + CI/CD triggers |

---

## 🏗 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│  │   Waiver    │ │   Login/    │ │   Payment   │ │   Admin     │ │
│  │   Signup    │ │   Register  │ │   Screen    │ │  Dashboard  │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (Express API)                       │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌────────────┐ │
│  │  Auth   │ │  Cards  │ │Payments │ │Check-ins│ │Notifications│ │
│  │ Routes  │ │ Routes  │ │ Routes  │ │ Routes  │ │   Routes   │ │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └────────────┘ │
└─────────────────────────────────────────────────────────────────┘
          │              │              │              │
          ▼              ▼              ▼              ▼
    ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
    │ Supabase │   │  Square  │   │  Resend  │   │  Twilio  │
    │ (DB/Auth)│   │  (Pay)   │   │  (Email) │   │  (SMS)   │
    └──────────┘   └──────────┘   └──────────┘   └──────────┘
```

---

## 🎯 Feature Details

### 1. Waiver Signup System

**How it works:**
1. New customer visits the waiver form
2. Fills out personal info (name, email, phone, address, emergency contact)
3. Signs electronically using mouse/touch
4. Backend generates PDF with signature embedded
5. PDF uploaded to Supabase Storage
6. Welcome email sent with PDF attachment
7. User account created automatically

**Key Files:**
- `src/components/screens/WaiverFormScreen.tsx` - Frontend form
- `backend/src/services/waivers/pdfGenerator.ts` - PDF creation
- `backend/src/services/waivers/emailService.ts` - Welcome email

---

### 2. QR Code Generation

**Format:** `ELDC_USER_{uuid}_{timestamp}_{random}`

**How it works:**
1. When user signs up, backend generates unique QR code string
2. Stored in `users.qr_code` column
3. Frontend generates visual QR using free API: `api.qrserver.com`
4. Staff scans QR → parsed to extract user ID → check-in processed

**Code Flow:**
```typescript
// Backend generates QR data (backend/src/services/users/userService.ts)
const qrCode = `ELDC_USER_${userId}_${Date.now()}_${random}`;

// Frontend displays using API (src/services/qrService.ts)
const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrCode}`;
```

---

### 3. 4-Digit Check-in Code

**Purpose:** Alternative to QR for manual entry

**How it works:**
1. Code generated on first use (not at signup)
2. Format: 4 random uppercase letters/numbers
3. Staff enters code → system looks up user → processes check-in
4. Codes are unique per user

**Code Location:** `backend/src/services/users/userService.ts`

---

### 4. Punch Card Purchase & Payment Flow

**This is the most complex feature. Here's the complete flow:**

```
┌────────────────┐     ┌────────────────┐     ┌────────────────┐
│  1. Customer   │────▶│  2. Frontend   │────▶│  3. Square SDK │
│  selects card  │     │  shows payment │     │  tokenizes card│
└────────────────┘     └────────────────┘     └────────────────┘
                                                      │
                                          Card "nonce" (token)
                                                      │
                                                      ▼
┌────────────────┐     ┌────────────────┐     ┌────────────────┐
│  6. Frontend   │◀────│  5. Backend    │◀────│  4. Backend    │
│  shows success │     │  creates card  │     │  charges Square│
└────────────────┘     └────────────────┘     └────────────────┘
```

**Detailed Steps:**

1. **Card Selection** (`src/components/screens/PunchCardOptions.tsx`)
   - Customer selects card type (5 classes, 10 classes, etc.)
   - Price, tax calculated and displayed

2. **Payment Form** (`src/components/SquarePayment.tsx`)
   - Square Web Payments SDK loads
   - Customer enters card details
   - SDK tokenizes card → returns "source ID" (nonce)
   - **Card number never touches our servers** (PCI compliant)

3. **Payment Processing** (`backend/src/services/payments/paymentService.ts`)
   ```typescript
   // Frontend sends sourceId (token) to backend
   const { sourceId, cardTypeId, userId, amountCents } = request;
   
   // Backend charges Square
   const { result } = await paymentsApi.createPayment({
       sourceId,
       amountMoney: { amount: BigInt(totalCents), currency: 'USD' },
       locationId: process.env.SQUARE_LOCATION_ID
   });
   
   // If successful, create punch card
   if (result.payment.status === 'COMPLETED') {
       // Insert into punch_cards table
       // Insert into payments table
   }
   ```

4. **Card Creation** - After successful payment:
   - Punch card inserted into `punch_cards` table
   - Payment record inserted into `payments` table
   - Card linked to user via `user_id`
   - Expiration date calculated from card type

**Square Confirmation:**
- Square SDK returns `payment.status === 'COMPLETED'`
- This is the confirmation that money was charged
- We store `square_payment_id` for reference/refunds

---

### 5. Check-in System

**Methods:**
1. QR Code scan
2. 4-digit code entry
3. Search by name/email

**Check-in Flow:**
```typescript
// backend/src/services/checkins/checkInService.ts

async function checkIn(data) {
    // 1. Parse QR code or lookup by code/ID
    const userId = parseQRCode(data.qr_code).entityId;
    
    // 2. Prevent duplicate check-ins (one per day)
    if (await hasCheckedInToday(userId)) {
        throw new Error('Already checked in today');
    }
    
    // 3. Find active punch card
    const card = await getActiveCard(userId);
    
    // 4. Deduct one class
    await deductClass(card.id);
    
    // 5. Record check-in
    await insertCheckIn({ user_id, punch_card_id, punched_by });
    
    // 6. Check for low balance alert
    if (card.classes_remaining <= 2) {
        await sendLowBalanceAlert(userId);
    }
}
```

---

### 6. Birthday Free Class System

**How it works:**
1. CRON job runs daily at 9 AM EST
2. Checks for users with birthday = today
3. Sends birthday email with free class offer
4. Staff can check in as "Birthday Check-in" (no punch deduction)

**Key Files:**
- `backend/src/services/birthday/birthdayService.ts`
- `backend/src/services/notifications/scheduler.ts`

---

### 7. Notification System

**Types of Notifications:**

| Notification | Trigger | Channel |
|--------------|---------|---------|
| Welcome Email | After waiver signup | Email (with PDF) |
| Low Balance Alert | ≤2 classes remaining | Email |
| Expiration Reminder | 3 days before, 1 day before | Email |
| Birthday Greeting | On birthday | Email + SMS |
| Password Reset | User request | Email |
| Purchase Confirmation | After payment | Email |

**Email Provider:** Resend API
**SMS Provider:** Twilio

---

### 8. Admin Dashboard

**Features:**
- View all customers
- Search by name/email
- View/edit customer cards
- Manual card creation (cash payments)
- Check-in history
- Analytics (coming soon)

---

## 📁 Project Structure

```
├── src/                          # Frontend
│   ├── components/
│   │   ├── screens/              # Full-page screens
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── WaiverFormScreen.tsx
│   │   │   ├── PaymentScreen.tsx
│   │   │   ├── AdminDashboard.tsx
│   │   │   └── ...
│   │   └── *.tsx                 # Shared components
│   ├── services/                 # API clients
│   │   ├── apiClient.ts          # Axios instance
│   │   ├── authService.ts
│   │   ├── qrService.ts
│   │   └── ...
│   └── App.tsx                   # Main app + routing
│
├── backend/                      # Backend
│   └── src/
│       ├── index.ts              # Express server setup
│       ├── middleware/           # Auth, error handling
│       ├── services/             # Feature modules
│       │   ├── auth/
│       │   ├── users/
│       │   ├── cards/
│       │   ├── payments/
│       │   ├── checkins/
│       │   ├── waivers/
│       │   └── notifications/
│       ├── shared/               # Utilities
│       │   ├── supabase.ts       # DB client
│       │   ├── types.ts          # TypeScript types
│       │   └── qr.ts             # QR parsing
│       └── jobs/                 # Scheduled tasks
```

---

## 🔐 Environment Variables

### Backend (Railway)
```env
# Database
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx

# Auth
JWT_SECRET=xxx
JWT_REFRESH_SECRET=xxx

# Square Payments
SQUARE_ACCESS_TOKEN=xxx
SQUARE_APPLICATION_ID=xxx
SQUARE_LOCATION_ID=xxx
SQUARE_ENVIRONMENT=production

# Email (Resend)
RESEND_API_KEY=xxx
FROM_EMAIL=noreply@estilolatinodance.com

# SMS (Twilio)
TWILIO_ACCOUNT_SID=xxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=xxx

# URLs
FRONTEND_URL=https://payments.estilolatinodance.com
```

### Frontend (Railway)
```env
VITE_API_URL=https://estilolatinodancecompany-production.up.railway.app
```

---

## 🚀 Deployment

**GitHub → Railway Auto-Deploy:**
1. Push code to `main` branch
2. Railway detects changes
3. Builds and deploys automatically (~2-3 minutes)

**Build Commands:**
- Frontend: `npm run build` (Vite)
- Backend: `npm run build` (TypeScript compilation)

---

## 📊 Database Schema (Key Tables)

```sql
users           -- Customer accounts
punch_cards     -- Purchased cards with class balance
card_types      -- Card templates (5-class, 10-class, etc.)
check_ins       -- Check-in history
payments        -- Payment records
waivers         -- Signed waivers
family_members  -- Family accounts linked to users
```

---

## 🔧 Key Integrations

### Square Payment Integration
- **SDK Version:** Web Payments SDK (frontend) + Square Node SDK (backend)
- **Flow:** Card → Token → Backend → Square API → Confirmation
- **PCI Compliance:** Card numbers never touch our servers

### Supabase Integration
- **Database:** PostgreSQL with Row Level Security
- **Storage:** Waiver PDFs stored in `documents` bucket
- **Auth:** Supabase handles password hashing, reset tokens

### Resend Email Integration
- **Domain:** `estilolatinodance.com` (verified)
- **Emails:** HTML templates with studio branding
- **Attachments:** PDF waivers via base64

---

## 📝 Notes

- **Tax Rate:** 6.625% NJ sales tax (configurable via `TAX_RATE` env var)
- **Card Expiration:** Varies by card type (3-6 months typically)
- **Check-in Limit:** One per person per day
- **Security:** JWT tokens, refresh tokens, rate limiting enabled
