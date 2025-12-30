# Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### 1. Test the Application

The app is ready to run! Here's how to test each user type:

#### Test as Customer
1. Click "Sign Up" on login screen
2. Fill in details (any email without "staff" or "admin")
3. Explore the 4 navigation tabs:
   - **Home**: View active card
   - **Buy Cards**: Purchase new cards
   - **History**: See check-in history
   - **Profile**: View QR code

#### Test as Staff
1. Login with email containing "staff@" or "office@"
2. Explore the 2 navigation tabs:
   - **Home**: Search or scan QR to punch cards
   - **History**: See today's check-ins

#### Test as Admin
1. Login with email containing "admin@"
2. Explore the 4 navigation tabs:
   - **Home**: Punch cards (like staff)
   - **Modify**: Create custom passes
   - **History**: View all activity with filters
   - **Admin**: Dashboard with analytics

### 2. Key Features to Try

✅ **Customer Journey**
```
Sign Up → View QR Code → Purchase Card → Get Checked In
```

✅ **Staff Workflow**
```
Login → Search Customer → Verify Card → Punch In
```

✅ **Admin Tasks**
```
Login → Create Pass for Existing Customer → View Analytics
```

## 📋 User Scenarios

### Scenario 1: New Customer Signs Up
```
1. Customer signs up
2. Gets welcome message
3. Sees empty dashboard
4. Purchases 15-class card ($225)
5. Card activates immediately
6. Can now show QR code to check in
```

### Scenario 2: Staff Checks In Customer
```
1. Staff logs in
2. Clicks "Search" on home screen
3. Types customer name/email/phone
4. Sees customer's active card
5. Clicks "Punch Card - Check In"
6. Customer is checked in
7. Card remaining classes decrements
```

### Scenario 3: Admin Creates Pass for Existing Customer
```
1. Admin logs in
2. Goes to "Modify" tab
3. Searches for customer
4. Enters number of classes (e.g., 10)
5. Sets expiration date (e.g., 2 months from now)
6. Creates pass
7. Customer can now use QR code to check in
```

## 🎯 Testing Checklist

### Customer Features
- [ ] Sign up for account
- [ ] View QR code in profile
- [ ] Browse punch card options
- [ ] See card pricing and expiration details
- [ ] View check-in history
- [ ] See statistics (monthly vs all-time)

### Staff Features
- [ ] Search customer by name
- [ ] Search customer by email
- [ ] Search customer by phone
- [ ] Punch active card
- [ ] See today's check-ins
- [ ] View check-in statistics

### Admin Features
- [ ] All staff features work
- [ ] Create custom pass
- [ ] Set custom expiration date
- [ ] View all check-in history
- [ ] Use pagination
- [ ] Filter by date range
- [ ] View expired cards
- [ ] Add new customer
- [ ] Delete customer
- [ ] View analytics graphs
- [ ] See revenue trends
- [ ] See attendance trends

## 🔧 Understanding the Code

### Adding a New Service Method

1. **Define in service** (`/services/yourService.ts`):
```typescript
async newMethod(param: string): Promise<ReturnType> {
  // TODO: Replace with API call
  return mockData;
}
```

2. **Use in component**:
```typescript
import { yourService } from '../../services';

const data = await yourService.newMethod(param);
```

### Creating a New Screen

1. **Create component** (`/components/screens/NewScreen.tsx`):
```typescript
export function NewScreen() {
  return (
    <div className="min-h-screen bg-brand-black pb-24">
      {/* Your content */}
    </div>
  );
}
```

2. **Add to App.tsx**:
```typescript
// Import
import { NewScreen } from './components/screens/NewScreen';

// Add screen type
type Screen = ... | 'new-screen';

// Add to renderScreen()
case 'new-screen':
  return <NewScreen />;
```

### Modifying Navigation

Edit `/components/BottomNav.tsx`:
```typescript
const getTabsForRole = () => {
  if (userRole === 'customer') {
    return [
      { id: 'home' as NavTab, icon: Home, label: 'Home' },
      // Add more tabs here
    ];
  }
  // ...
};
```

## 📊 Data Flow Example

### Customer Purchases Card

```
1. User clicks "Select This Card" in PunchCardOptions
   ↓
2. Component calls handleSelectCard()
   ↓
3. Navigates to CheckoutScreen with selected card
   ↓
4. User confirms purchase
   ↓
5. Component calls handleCheckoutComplete()
   ↓
6. Calls punchCardService.purchaseCard()
   ↓
7. Service creates new PunchCard object
   ↓
8. Returns to component
   ↓
9. Shows success modal
   ↓
10. Updates userActiveCard state
   ↓
11. Navigates to CustomerDashboard
```

## 🎨 Styling Guide

### Use Existing Classes
```tsx
// Background
className="bg-brand-black"     // Black background
className="bg-gray-900"        // Dark gray background

// Text
className="text-brand-white"   // White text
className="text-brand-yellow"  // Yellow text
className="text-gray-400"      // Gray text

// Borders
className="border-gray-700"    // Gray border
className="border-brand-yellow" // Yellow border

// Cards
<Card padding="large">         // Use Card component
<Card padding="medium" className="bg-gray-900">
```

### Touch Targets
Always ensure buttons are at least 44px tall:
```tsx
<Button className="h-14">      // 56px height
<Button className="h-12">      // 48px height (minimum)
```

## 🐛 Common Issues & Solutions

### Issue: Service returns undefined
**Solution**: Check if you're using `await` when calling async methods
```typescript
// ❌ Wrong
const data = yourService.getData();

// ✅ Correct
const data = await yourService.getData();
```

### Issue: Component doesn't update
**Solution**: Make sure you're using state correctly
```typescript
// ❌ Wrong - mutating state directly
userCard.classesRemaining = 5;

// ✅ Correct - creating new object
setUserCard({ ...userCard, classesRemaining: 5 });
```

### Issue: Navigation doesn't work
**Solution**: Check that you're:
1. Updating `activeTab` state
2. Updating `currentScreen` state
3. Passing correct `userRole` to BottomNav

## 🔮 Next Steps

### Immediate (Current Sprint)
1. Test all user flows
2. Fix any bugs found
3. Refine UI/UX based on feedback

### Short Term (Next Sprint)
1. Add email verification
2. Integrate Stripe for payments
3. Add SMS notifications

### Long Term (Future Sprints)
1. Connect to real database
2. Deploy to production
3. Add automated testing
4. Implement monitoring

## 📚 Useful Commands

```bash
# Run development server
npm start

# Build for production
npm run build

# Run tests (when implemented)
npm test

# Check TypeScript errors
npm run type-check
```

## 💡 Pro Tips

1. **Use TypeScript**: Let types guide you. If something is typed as `Promise<User>`, use await!

2. **Follow the Pattern**: Look at existing screens/services for examples

3. **Mock First**: Build UI with mock data, then swap in real APIs

4. **Test Each Role**: Always test as customer, staff, and admin

5. **Check Mobile**: The app is mobile-first, test on small screens

6. **Use Services**: Never put business logic in components, use services

## 🆘 Need Help?

### Documentation
- `README.md` - Overview and features
- `ARCHITECTURE.md` - Detailed architecture
- `QUICKSTART.md` - This file

### Key Files to Understand
1. `/App.tsx` - Main app logic and routing
2. `/services/index.ts` - All services exported
3. `/components/BottomNav.tsx` - Navigation logic
4. `/services/types.ts` - All TypeScript types

### Debugging
```typescript
// Add console.log to services
console.log('Service called with:', param);
console.log('Service returning:', result);

// Add console.log to components
console.log('Current state:', currentUser);
console.log('Active screen:', currentScreen);
```

---

Happy coding! 🎉
