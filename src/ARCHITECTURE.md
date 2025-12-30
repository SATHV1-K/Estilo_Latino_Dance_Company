# Architecture Documentation

## Microservices Architecture Overview

This application is built with a **microservices-style architecture** that separates concerns into independent, reusable services. This design makes it easy to:
- Modify individual features without breaking the app
- Scale specific services independently
- Add new features smoothly
- Transition to a backend API

## Service Layer Design

### Core Principles
1. **Single Responsibility** - Each service handles one domain
2. **Independence** - Services don't depend on each other
3. **Testability** - Services can be tested in isolation
4. **Scalability** - Services can become separate microservices

### Service Catalog

#### 1. authService
**Purpose**: Handle user authentication and session management

**Methods**:
- `login(email, password)` - Authenticate user
- `signUp(data)` - Register new user
- `logout()` - End user session
- `getCurrentUser()` - Get current logged-in user

**Future Integration**:
- JWT token management
- OAuth integration
- Session persistence
- Password reset

#### 2. punchCardService
**Purpose**: Manage punch cards and pricing

**Methods**:
- `getCardOptions()` - Get available card packages
- `getUserCards(userId)` - Get user's cards
- `getActiveCard(userId)` - Get user's active card
- `purchaseCard(userId, optionId, paymentData)` - Purchase new card
- `getAllExpiredCards()` - Get all expired cards (admin)
- `createAdminPass(userId, classes, expiration, adminId)` - Create manual pass

**Future Integration**:
- Stripe payment processing
- Card activation workflow
- Expiration checking cron jobs
- Revenue tracking

#### 3. checkInService
**Purpose**: Handle check-ins and attendance tracking

**Methods**:
- `checkInUser(userId, userName, cardId, ...)` - Check in user
- `getUserCheckInHistory(userId)` - Get user's history
- `getTodayCheckIns()` - Get today's check-ins (staff)
- `getAllCheckIns(page, limit, filters)` - Get all check-ins with pagination (admin)
- `searchUserByIdentifier(identifier)` - Search by name/email/phone/QR

**Future Integration**:
- Real-time updates
- Attendance analytics
- Class capacity management
- Check-in validation

#### 4. userService
**Purpose**: User management and customer operations

**Methods**:
- `getAllCustomers()` - Get all customers
- `getUserById(userId)` - Get specific user
- `searchUsers(query)` - Search users
- `createCustomer(data)` - Add new customer (admin)
- `deleteCustomer(userId)` - Remove customer (admin)
- `getUserByQRCode(qrCode)` - Find user by QR code

**Future Integration**:
- User profiles
- Permission management
- Customer segmentation
- Data export

#### 5. analyticsService
**Purpose**: Reporting and business intelligence

**Methods**:
- `getMonthlyAnalytics(months)` - Get monthly trends
- `getCurrentMonthStats()` - Get current month summary
- `getRevenueByCardType()` - Revenue breakdown
- `getAttendanceTrends(days)` - Attendance patterns

**Future Integration**:
- Advanced reporting
- Predictive analytics
- Export to CSV/PDF
- Custom dashboards

#### 6. qrService
**Purpose**: QR code generation and validation

**Methods**:
- `generateUserQRCode(userId, email)` - Create QR code
- `decodeQRCode(qrCode)` - Decode QR data
- `validateQRCode(qrCode)` - Verify QR validity
- `generateQRCodeSVG(qrData)` - Generate SVG representation

**Future Integration**:
- Real QR code library integration
- QR code expiration
- Security enhancements
- Batch generation

#### 7. notificationService
**Purpose**: Communication with customers

**Methods**:
- `sendEmail(to, subject, body)` - Send email
- `sendSMS(to, message)` - Send SMS
- `sendCardExpirationReminder(...)` - Expiration alerts
- `sendWelcomeEmail(...)` - Welcome new users
- `sendPurchaseConfirmation(...)` - Purchase receipts
- `sendEmailVerification(...)` - Email verification
- `sendSMSVerification(...)` - SMS verification

**Future Integration**:
- SendGrid/AWS SES integration
- Twilio SMS integration
- Template management
- Scheduled notifications

#### 8. paymentService
**Purpose**: Payment processing and financial transactions

**Methods**:
- `createPaymentIntent(amount, currency, metadata)` - Create payment
- `confirmPayment(paymentIntentId)` - Verify payment
- `refundPayment(paymentIntentId, amount)` - Process refund
- `getPaymentHistory(userId)` - Get payment history

**Future Integration**:
- Stripe SDK integration
- PCI compliance
- Subscription management
- Invoice generation

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Presentation Layer                 │
│              (React Components/Screens)              │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│                   Service Layer                      │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│   │  Auth    │  │  Cards   │  │  Users   │  ...    │
│   │ Service  │  │ Service  │  │ Service  │         │
│   └──────────┘  └──────────┘  └──────────┘         │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│              API Layer (Future)                      │
│         RESTful API / GraphQL / gRPC                 │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│              Data Layer (Future)                     │
│    Database (PostgreSQL/MongoDB) + Cache (Redis)     │
└─────────────────────────────────────────────────────┘
```

## Screen-to-Service Mapping

### Customer Screens
- **CustomerDashboard** → `punchCardService`, `checkInService`
- **PunchCardOptions** → `punchCardService`
- **CustomerHistory** → `checkInService`
- **CustomerProfile** → `authService`, `qrService`
- **CheckoutScreen** → `punchCardService`, `paymentService`

### Staff Screens
- **StaffPunchInterface** → `checkInService`, `userService`, `punchCardService`, `qrService`
- **StaffHistory** → `checkInService`

### Admin Screens
- **AdminPunchInterface** → `checkInService`, `userService`, `punchCardService`, `qrService`
- **AdminModify** → `userService`, `punchCardService`
- **AdminHistory** → `checkInService`
- **AdminDashboard** → `analyticsService`, `punchCardService`, `userService`

## Transition to Backend

### Phase 1: Current State (Mock Services)
```typescript
class PunchCardService {
  async getUserCards(userId: string): Promise<PunchCard[]> {
    // Returns mock data
    return mockCards;
  }
}
```

### Phase 2: API Integration
```typescript
class PunchCardService {
  private apiUrl = process.env.REACT_APP_API_URL;
  
  async getUserCards(userId: string): Promise<PunchCard[]> {
    const response = await fetch(`${this.apiUrl}/cards/user/${userId}`, {
      headers: { Authorization: `Bearer ${this.getToken()}` }
    });
    return response.json();
  }
}
```

### Phase 3: Microservices
Each service becomes a separate microservice:
- `auth-service` (Port 3001)
- `card-service` (Port 3002)
- `checkin-service` (Port 3003)
- `user-service` (Port 3004)
- etc.

## Database Schema (Future)

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20),
  role VARCHAR(20),
  qr_code TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Punch Cards Table
```sql
CREATE TABLE punch_cards (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  name VARCHAR(100),
  total_classes INT,
  classes_remaining INT,
  expiration_date DATE,
  purchase_date DATE,
  price DECIMAL(10,2),
  is_active BOOLEAN,
  is_expired BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Check-Ins Table
```sql
CREATE TABLE check_ins (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  card_id UUID REFERENCES punch_cards(id),
  timestamp TIMESTAMP,
  punched_by VARCHAR(255),
  punched_by_role VARCHAR(20),
  created_at TIMESTAMP
);
```

## Security Considerations

### Current (Development)
- Basic role-based routing
- No real authentication
- Mock data

### Production Requirements
1. **Authentication**
   - JWT tokens
   - Refresh tokens
   - Secure password hashing (bcrypt)

2. **Authorization**
   - Role-based access control (RBAC)
   - API endpoint permissions
   - Data filtering by user role

3. **Data Protection**
   - HTTPS only
   - Input validation
   - SQL injection prevention
   - XSS protection
   - CSRF tokens

4. **PII Handling**
   - Encrypted sensitive data
   - GDPR compliance
   - Data retention policies
   - Secure deletion

## Performance Optimization

### Future Enhancements
1. **Caching**
   - Redis for session management
   - Cache frequently accessed data
   - Invalidation strategies

2. **Database Optimization**
   - Indexes on foreign keys
   - Query optimization
   - Connection pooling

3. **API Optimization**
   - Rate limiting
   - Response compression
   - CDN for static assets

4. **Frontend Optimization**
   - Code splitting
   - Lazy loading
   - Service worker for offline support

## Monitoring & Observability

### Future Implementation
1. **Logging**
   - Centralized logging (ELK stack)
   - Error tracking (Sentry)
   - Audit trails

2. **Metrics**
   - Application performance monitoring
   - Business metrics
   - Custom dashboards

3. **Alerts**
   - Error rate thresholds
   - Performance degradation
   - Business KPI alerts

## Testing Strategy

### Unit Tests (Service Layer)
```typescript
describe('PunchCardService', () => {
  it('should get active card for user', async () => {
    const card = await punchCardService.getActiveCard('user_123');
    expect(card).toBeDefined();
    expect(card?.isActive).toBe(true);
  });
});
```

### Integration Tests
- Test service interactions
- API endpoint testing
- Database operations

### E2E Tests
- User flow testing
- Cross-browser testing
- Mobile responsiveness

## Deployment Architecture

### Development
- Local development server
- Mock services
- Hot reload

### Staging
- Similar to production
- Test data
- Integration testing

### Production
```
                    ┌──────────────┐
                    │  Load        │
                    │  Balancer    │
                    └──────┬───────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   ┌────▼────┐       ┌────▼────┐       ┌────▼────┐
   │  Web    │       │  Web    │       │  Web    │
   │  Server │       │  Server │       │  Server │
   └────┬────┘       └────┬────┘       └────┬────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                    ┌──────▼───────┐
                    │   API        │
                    │   Gateway    │
                    └──────┬───────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   ┌────▼────┐       ┌────▼────┐       ┌────▼────┐
   │ Service │       │ Service │       │ Service │
   │    1    │       │    2    │       │    3    │
   └────┬────┘       └────┬────┘       └────┬────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                    ┌──────▼───────┐
                    │   Database   │
                    │   Cluster    │
                    └──────────────┘
```

## Conclusion

This microservices architecture provides:
- **Flexibility** - Easy to modify and extend
- **Scalability** - Can grow with business needs
- **Maintainability** - Clear separation of concerns
- **Reliability** - Independent service failures
- **Developer Experience** - Easy to understand and work with

The current implementation uses mock services that can be seamlessly replaced with real API calls, making the transition to production smooth and predictable.
