// Punch Card Service - Handles punch card operations via real API

import { apiClient, ApiResponse } from './apiClient';
import { PunchCard, PunchCardOption } from './types';

// API response types
interface CardTypeApi {
  id: string;
  name: string;
  classes: number;
  expiration_months: number;
  price: number;
  price_per_class: number;
  description: string | null;
  is_active: boolean;
  card_category?: 'punch_card' | 'subscription';
}

interface PunchCardApi {
  id: string;
  user_id: string | null;
  family_member_id: string | null;
  card_type_id: string;
  total_classes: number;
  classes_remaining: number;
  purchase_date: string;
  expiration_date: string;
  amount_paid: number;
  status: 'active' | 'expired' | 'exhausted';
  payment_method: string;
  card_type?: CardTypeApi;
}

// Convert API types to frontend types
function mapApiCardToOption(card: CardTypeApi): PunchCardOption {
  // Ensure price values are valid numbers (handle null/undefined/string)
  const price = card.price != null ? Number(card.price) : 0;
  const pricePerClass = card.price_per_class != null ? Number(card.price_per_class) : 0;

  return {
    id: card.id,
    name: card.name,
    classes: card.classes,
    expirationMonths: card.expiration_months,
    price: isNaN(price) ? 0 : price,
    pricePerClass: isNaN(pricePerClass) ? 0 : pricePerClass,
    description: card.description || '',
    cardCategory: card.card_category || 'punch_card',
  };
}

function mapApiPunchCard(card: PunchCardApi): PunchCard {
  // Get today's date in local timezone (not UTC)
  const now = new Date();
  const todayStr = now.toLocaleDateString('en-CA'); // Format: YYYY-MM-DD in local timezone

  // Show "Admin Pass" for cards created by admin, otherwise use card type name
  const cardName = card.payment_method === 'admin_created'
    ? 'Admin Pass'
    : (card.card_type?.name || 'Unknown');

  return {
    id: card.id,
    userId: card.user_id || card.family_member_id || '',
    name: cardName,
    totalClasses: card.total_classes,
    classesRemaining: card.classes_remaining,
    expirationDate: card.expiration_date,
    purchaseDate: card.purchase_date,
    price: Number(card.amount_paid),
    pricePerClass: card.card_type ? Number(card.card_type.price_per_class) : 0,
    isActive: card.status === 'active',
    // Compare date strings to avoid timezone issues - card expires at END of expiration day
    isExpired: card.status === 'expired' || card.expiration_date < todayStr,
  };
}

class PunchCardService {
  // Get available punch card options
  async getCardOptions(): Promise<PunchCardOption[]> {
    const response = await apiClient.get<ApiResponse<CardTypeApi[]>>('/api/cards/types');

    if (!response.success || !response.data) {
      throw new Error('Failed to fetch card options');
    }

    return response.data.map(mapApiCardToOption);
  }

  // Get all cards for a user
  async getUserCards(userId: string): Promise<PunchCard[]> {
    const response = await apiClient.get<ApiResponse<PunchCardApi[]>>(`/api/cards/user/${userId}`);

    if (!response.success || !response.data) {
      return [];
    }

    return response.data.map(mapApiPunchCard);
  }

  // Get cards for a family member
  async getFamilyMemberCards(memberId: string): Promise<PunchCard[]> {
    const response = await apiClient.get<ApiResponse<PunchCardApi[]>>(`/api/cards/family-member/${memberId}`);

    if (!response.success || !response.data) {
      return [];
    }

    return response.data.map(mapApiPunchCard);
  }

  // Get active card for the currently logged-in user (customer)
  async getMyActiveCard(): Promise<PunchCard | null> {
    try {
      const response = await apiClient.get<ApiResponse<PunchCardApi>>('/api/cards/my-active');
      if (response.success && response.data) {
        return mapApiPunchCard(response.data);
      }
    } catch {
      return null;
    }
    return null;
  }

  // Get active card for check-in (staff only - for looking up other users)
  async getActiveCard(userId?: string, familyMemberId?: string): Promise<PunchCard | null> {
    let endpoint = '';
    if (userId) {
      endpoint = `/api/cards/active/user/${userId}`;
    } else if (familyMemberId) {
      endpoint = `/api/cards/active/family-member/${familyMemberId}`;
    } else {
      return null;
    }

    try {
      const response = await apiClient.get<ApiResponse<PunchCardApi>>(endpoint);
      if (response.success && response.data) {
        return mapApiPunchCard(response.data);
      }
    } catch {
      return null;
    }
    return null;
  }

  // Admin create a pass (cash payment)
  async adminCreatePass(data: {
    userId?: string;
    familyMemberId?: string;
    classes: number;
    expirationDate: string;
    amountPaid: number;
  }): Promise<PunchCard> {
    const response = await apiClient.post<ApiResponse<PunchCardApi>>('/api/cards/admin-create', {
      user_id: data.userId,
      family_member_id: data.familyMemberId,
      classes: data.classes,
      expiration_date: data.expirationDate,
      amount_paid: data.amountPaid,
    });

    if (!response.success || !response.data) {
      throw new Error('Failed to create pass');
    }

    return mapApiPunchCard(response.data);
  }

  // Get all expired cards (admin only)
  async getAllExpiredCards(): Promise<PunchCard[]> {
    try {
      const response = await apiClient.get<ApiResponse<PunchCardApi[]>>('/api/cards/expired');
      if (response.success && response.data) {
        return response.data.map(mapApiPunchCard);
      }
    } catch {
      return [];
    }
    return [];
  }

  // Get cards expiring soon (admin only)
  async getCardsExpiringSoon(days: number = 7): Promise<PunchCard[]> {
    try {
      const response = await apiClient.get<ApiResponse<PunchCardApi[]>>(`/api/cards/expiring-soon?days=${days}`);
      if (response.success && response.data) {
        return response.data.map(mapApiPunchCard);
      }
    } catch {
      return [];
    }
    return [];
  }

  // Get low balance cards (admin only)
  async getLowBalanceCards(): Promise<PunchCard[]> {
    try {
      const response = await apiClient.get<ApiResponse<PunchCardApi[]>>('/api/cards/low-balance');
      if (response.success && response.data) {
        return response.data.map(mapApiPunchCard);
      }
    } catch {
      return [];
    }
    return [];
  }

  // Get all cards with user info (admin only)
  async getAllCards(page: number = 1, limit: number = 20, status?: string): Promise<{
    data: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      let url = `/api/cards/all?page=${page}&limit=${limit}`;
      if (status) {
        url += `&status=${status}`;
      }
      const response = await apiClient.get<any>(url);
      if (response.success) {
        return {
          data: response.data || [],
          total: response.total || 0,
          page: response.page || 1,
          // API returns total_pages (snake_case), map to camelCase
          totalPages: response.total_pages || response.totalPages || 1,
        };
      }
    } catch {
      // Return empty result on error
    }
    return { data: [], total: 0, page: 1, totalPages: 1 };
  }

  // Get revenue statistics (admin only)
  async getRevenueStats(): Promise<{
    totalRevenue: number;
    thisMonthRevenue: number;
    lastMonthRevenue: number;
    totalCardsSold: number;
  }> {
    try {
      const response = await apiClient.get<any>('/api/cards/revenue-stats');
      if (response.success && response.data) {
        return response.data;
      }
    } catch {
      // Return zeros on error
    }
    return {
      totalRevenue: 0,
      thisMonthRevenue: 0,
      lastMonthRevenue: 0,
      totalCardsSold: 0,
    };
  }

  // Get today's birthdays (admin only)
  async getTodaysBirthdays(): Promise<any[]> {
    try {
      const response = await apiClient.get<any>('/api/birthday/todays-birthdays');
      if (response.success && response.data) {
        return response.data;
      }
    } catch {
      return [];
    }
    return [];
  }

  // TODO: Purchase card (placeholder for when payments are implemented)
  async purchaseCard(_cardOptionId: string, _userId: string): Promise<PunchCard | null> {
    // This will be implemented when Square payments are integrated
    console.warn('Online card purchase not yet implemented');
    return null;
  }
}

export const punchCardService = new PunchCardService();