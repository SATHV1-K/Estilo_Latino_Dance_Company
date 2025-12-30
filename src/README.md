# Estilo Latino Dance Studio - Punch Card Management System

A complete mobile-first web application for managing dance class punch cards, built with React, TypeScript, and a microservices-style architecture.

## 🏗️ Architecture Overview

This application follows a **microservices-style architecture** with clear separation of concerns:

### Service Layer (`/services`)
Each service is independent and handles a specific domain:

- **authService** - User authentication and registration
- **punchCardService** - Punch card management and purchasing
- **checkInService** - Check-in operations and history
- **userService** - User management and search
- **analyticsService** - Reporting and analytics data
- **qrService** - QR code generation and validation
- **notificationService** - Email and SMS notifications
- **paymentService** - Payment processing (Stripe integration)

### Benefits of This Architecture
- ✅ **Easy to modify** - Each service is independent
- ✅ **Scalable** - Services can be moved to separate APIs
- ✅ **Maintainable** - Clear separation of concerns
- ✅ **Testable** - Services can be tested independently
- ✅ **Future-proof** - Ready for backend integration

## 👥 User Types & Features

### 1. Customers (4 Navigation Icons)

#### Home
- View active punch card with remaining classes
- See expiration date (expires from purchase date)
- Quick access to buy more classes or view history

#### Buy Cards
Available punch card options:
- **Single Class**: $25 each (no expiration)
- **4 Classes Card**: $95 (1 month expiration)
- **8 Classes Card**: $150 (1 month expiration)
- **10 Classes Card**: $195 (2 months expiration)
- **15 Classes Card**: $225 (2 months expiration) - BEST VALUE

**Important**: Cards expire from purchase date, not first check-in.

#### History
- Complete check-in history
- Grouped by date
- Shows card used, time, and who punched the card
- Monthly and all-time statistics

#### Profile
- Personal information display
- **QR Code generation** - Shows unique QR code for check-in
- Account settings
- Logout option

### 2. Office Staff (2 Navigation Icons)

#### Home - Punch Cards
Two check-in methods:
1. **Search by name, email, or phone number**
2. **Scan customer's QR code**

Features:
- Verify customer information
- View active punch card details
- Punch card to check in customer
- Error handling for expired/no cards

#### History
- Shows **today's check-ins only**
- Real-time updates
- Summary statistics (total, last hour, unique customers)
- Refresh capability

### 3. Admin (4 Navigation Icons)

#### Home - Punch Cards
Same as staff with admin privileges:
- Search or scan QR code to find customers
- Punch cards for check-ins
- Full admin access

#### Modify - Create Passes
**Critical for transitioning existing customers**:
- Search for customer
- Manually create punch card with:
  - Custom number of classes
  - Custom expiration date
- Perfect for customers who purchased before system implementation
- All actions are logged

#### History - All Activity
Complete system activity with:
- **Pagination** (20 items per page)
- **Filters**:
  - Search by customer
  - Filter by date range (all, today, week, month)
- Shows all check-ins across all users
- Navigation between pages

#### Admin Dashboard
Comprehensive management:

**Metrics**:
- Total revenue (current month)
- New customers (current month)
- Total check-ins (current month)
- Active cards count

**View Expired Cards**:
- List of all expired punch cards
- Shows remaining classes and expiration dates
- Helps identify customers who need new cards

**Manage Customers**:
- **Add new customers** manually
- **Delete customers** (with confirmation)
- View all customers in system

**View Reports** with analytics graphs:
- Monthly trends (line chart): New customers & Attendance
- Revenue & Active Cards (bar chart)
- Summary statistics

## 🎨 Design System

### Brand Colors
- **Primary Black**: #000000
- **Primary Yellow/Gold**: #FFC700

### Mobile-First Design
- Optimized for 375px width (iPhone-sized)
- Minimum 44px touch targets
- Generous whitespace
- Card-based layouts
- High contrast ratios for accessibility

## 🔮 Future Enhancements

### Phase 2 (Planned)
1. **Email & Phone Verification**
   - Verify users during sign up
   - `notificationService.sendEmailVerification()`
   - `notificationService.sendSMSVerification()`

2. **Stripe Integration**
   - Real payment processing
   - `paymentService.createPaymentIntent()`
   - Card activation after successful payment

3. **Automated Notifications**
   - Card expiration reminders
   - Low classes remaining alerts
   - `notificationService.sendCardExpirationReminder()`

4. **Database Integration**
   - Replace mock services with real database
   - Full ACID compliance
   - Secure data storage
   - Follow SDLC best practices

5. **Scalability**
   - Support for 1000+ total users
   - Handle 100+ daily active users
   - Performance optimization
   - Caching strategies

## 📁 Project Structure

```
/
├── services/              # Microservices layer
│   ├── types.ts          # TypeScript type definitions
│   ├── authService.ts    # Authentication
│   ├── punchCardService.ts
│   ├── checkInService.ts
│   ├── userService.ts
│   ├── analyticsService.ts
│   ├── qrService.ts
│   ├── notificationService.ts
│   ├── paymentService.ts
│   └── index.ts          # Service exports
│
├── components/           # React components
│   ├── screens/         # Screen components
│   │   ├── LoginScreen.tsx
│   │   ├── SignUpScreen.tsx
│   │   ├── CustomerDashboard.tsx
│   │   ├── CustomerHistory.tsx
│   │   ├── CustomerProfile.tsx
│   │   ├── PunchCardOptions.tsx
│   │   ├── CheckoutScreen.tsx
│   │   ├── StaffPunchInterface.tsx
│   │   ├── StaffHistory.tsx
│   │   ├── AdminPunchInterface.tsx
│   │   ├── AdminModify.tsx
│   │   ├── AdminHistory.tsx
│   │   └── AdminDashboard.tsx
│   │
│   ├── ui/              # Shadcn/UI components
│   ├── BottomNav.tsx
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Input.tsx
│   ├── Badge.tsx
│   └── ...
│
├── App.tsx              # Main application
└── styles/
    └── globals.css      # Global styles
```

## 🚀 Getting Started

### Login Credentials (Demo)
- **Customer**: Use any email without "staff@" or "admin@"
- **Staff**: Use email containing "staff@" or "office@"
- **Admin**: Use email containing "admin@"

### Key Features to Test

**As a Customer**:
1. Sign up for an account
2. View your QR code in Profile tab
3. Purchase a punch card
4. View check-in history

**As Staff**:
1. Search for a customer or scan their QR code
2. Punch their card to check them in
3. View today's check-ins in History

**As Admin**:
1. Use all staff features
2. Create custom passes in Modify tab
3. View complete history with filters
4. Manage customers (add/delete)
5. View analytics reports with graphs

## 🔧 Technical Details

### Services Architecture
All services follow a consistent pattern:
```typescript
class ServiceName {
  async methodName(params): Promise<ReturnType> {
    // TODO: Replace with actual API call
    // Mock implementation for now
    return mockData;
  }
}

export const serviceName = new ServiceName();
```

This makes it easy to:
- Replace mock data with real API calls
- Test services independently
- Maintain consistent interfaces
- Scale to microservices

### Type Safety
Full TypeScript support with shared types:
- `User`, `PunchCard`, `PunchCardOption`
- `CheckIn`, `AnalyticsData`
- Ensures consistency across the application

## 📊 Data Flow

```
User Action
    ↓
Component calls Service
    ↓
Service processes (currently mock)
    ↓
Service returns data
    ↓
Component updates UI
```

In production:
```
Service → API Call → Database → Response → Service → Component
```

## 🎯 Production Readiness Checklist

- [x] Modular microservices architecture
- [x] Complete UI for all user types
- [x] Mobile-first responsive design
- [x] QR code generation
- [ ] Email/SMS verification
- [ ] Stripe payment integration
- [ ] Real database connection
- [ ] API endpoint implementation
- [ ] Automated notifications
- [ ] Performance optimization
- [ ] Security hardening
- [ ] Load testing

## 💡 Developer Notes

### Adding New Features
1. Create/update service in `/services`
2. Update types in `/services/types.ts`
3. Create/update screen component
4. Wire up in `App.tsx`

### Modifying Services
Each service is independent. Changes to one service shouldn't affect others.

### Testing
Services can be tested independently by mocking their dependencies.

## 📝 License

Private - Estilo Latino Dance Studio

---

Built with ❤️ for the dance community
