// Core type definitions for the application

export type UserRole = 'customer' | 'staff' | 'admin';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: UserRole;
  createdAt: string;
  qrCode?: string;
  checkInCode?: string;
  birthday?: string;
}

export interface PunchCard {
  id: string;
  userId: string;
  name: string;
  totalClasses: number;
  classesRemaining: number;
  expirationDate: string;
  purchaseDate: string;
  price: number;
  pricePerClass: number;
  isActive: boolean;
  isExpired: boolean;
}

export interface PunchCardOption {
  id: string;
  name: string;
  classes: number;
  expirationMonths: number;
  price: number;
  pricePerClass: number;
  description: string;
}

export interface CheckIn {
  id: string;
  userId: string;
  userName: string;
  cardId: string;
  cardName: string;
  timestamp: string;
  punchedBy: string;
  punchedByRole: UserRole;
  isBirthdayCheckIn?: boolean;
  classesRemaining?: number;
}

export interface AdminPass {
  userId: string;
  remainingClasses: number;
  expirationDate: string;
  createdBy: string;
  createdAt: string;
}

export interface AnalyticsData {
  month: string;
  newCustomers: number;
  attendance: number;
  revenue: number;
  activeCards: number;
}
