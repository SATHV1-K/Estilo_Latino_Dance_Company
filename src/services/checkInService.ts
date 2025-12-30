// Check-In Service - Handles customer check-in operations via real API

import { apiClient, ApiResponse } from './apiClient';
import { CheckIn, UserRole } from './types';

// API response types
interface CheckInApi {
  id: string;
  user_id: string | null;
  family_member_id: string | null;
  punch_card_id: string | null;
  is_birthday_checkin: boolean;
  birthday_pass_id: string | null;
  checked_in_at: string;
  punched_by_user_id: string;
  notes: string | null;
  person_name: string;
  card_name: string;
  punched_by_name: string;
  classes_remaining?: number;
}

interface SearchResult {
  users: Array<{
    id: string;
    email: string;
    phone: string | null;
    role: UserRole;
    first_name: string;
    last_name: string;
    qr_code: string | null;
  }>;
  familyMembers: Array<{
    id: string;
    first_name: string;
    last_name: string;
    qr_code: string | null;
    parent_email: string;
  }>;
}

interface BirthdayPass {
  id: string;
  valid_date: string;
  expires_at: string;
  used: boolean;
}

// Convert API check-in to frontend type
function mapApiCheckIn(ci: CheckInApi): CheckIn {
  return {
    id: ci.id,
    userId: ci.user_id || ci.family_member_id || '',
    userName: ci.person_name,
    cardId: ci.punch_card_id || '',
    cardName: ci.card_name,
    timestamp: ci.checked_in_at,
    punchedBy: ci.punched_by_name,
    punchedByRole: 'staff', // API doesn't return this, defaulting to 'staff'
    isBirthdayCheckIn: ci.is_birthday_checkin,
    classesRemaining: ci.classes_remaining,
  };
}

class CheckInService {
  // Search for customers by name, email, phone, or QR code (staff/admin)
  async searchCustomers(query: string): Promise<{
    users: Array<{
      id: string;
      name: string;
      email: string;
      phone: string;
      qrCode: string;
      type: 'user';
    }>;
    familyMembers: Array<{
      id: string;
      name: string;
      parentEmail: string;
      qrCode: string;
      type: 'family_member';
    }>;
  }> {
    const response = await apiClient.get<ApiResponse<SearchResult>>(`/api/users/search?query=${encodeURIComponent(query)}`);

    if (!response.success || !response.data) {
      return { users: [], familyMembers: [] };
    }

    const users = response.data.users.map(u => ({
      id: u.id,
      name: `${u.first_name} ${u.last_name}`,
      email: u.email,
      phone: u.phone || '',
      qrCode: u.qr_code || '',
      type: 'user' as const,
    }));

    const familyMembers = response.data.familyMembers.map(fm => ({
      id: fm.id,
      name: `${fm.first_name} ${fm.last_name}`,
      parentEmail: fm.parent_email,
      qrCode: fm.qr_code || '',
      type: 'family_member' as const,
    }));

    return { users, familyMembers };
  }

  // Find by QR code (staff/admin)
  async findByQrCode(qrCode: string): Promise<{
    type: 'user' | 'family_member';
    id: string;
    name: string;
  } | null> {
    try {
      const response = await apiClient.get<ApiResponse<{
        type: 'user' | 'family_member';
        entity: {
          id: string;
          first_name: string;
          last_name: string;
        };
      }>>(`/api/users/qr/${encodeURIComponent(qrCode)}`);

      if (response.success && response.data) {
        return {
          type: response.data.type,
          id: response.data.entity.id,
          name: `${response.data.entity.first_name} ${response.data.entity.last_name}`,
        };
      }
    } catch {
      return null;
    }
    return null;
  }

  // Check in a customer (staff/admin)
  async checkIn(data: {
    userId?: string;
    familyMemberId?: string;
    qrCode?: string;
    useBirthdayPass?: boolean;
    isBirthdayCheckIn?: boolean;  // Direct birthday check-in (no pass needed)
    notes?: string;
  }): Promise<CheckIn> {
    const response = await apiClient.post<ApiResponse<CheckInApi> & { message?: string }>('/api/checkins', {
      user_id: data.userId,
      family_member_id: data.familyMemberId,
      qr_code: data.qrCode,
      use_birthday_pass: data.useBirthdayPass,
      is_birthday_checkin: data.isBirthdayCheckIn,
      notes: data.notes,
    });

    if (!response.success || !response.data) {
      throw new Error('Check-in failed');
    }

    return mapApiCheckIn(response.data);
  }

  // Get today's check-ins (staff/admin)
  async getTodayCheckIns(): Promise<CheckIn[]> {
    const response = await apiClient.get<ApiResponse<CheckInApi[]> & { count?: number }>('/api/checkins/today');

    if (!response.success || !response.data) {
      return [];
    }

    return response.data.map(mapApiCheckIn);
  }

  // Get check-in history with pagination (staff/admin)
  async getCheckInHistory(page: number = 1, limit: number = 20, startDate?: string, endDate?: string): Promise<{
    checkIns: CheckIn[];
    total: number;
    totalPages: number;
  }> {
    let url = `/api/checkins/history?page=${page}&limit=${limit}`;
    if (startDate) url += `&start_date=${startDate}`;
    if (endDate) url += `&end_date=${endDate}`;

    const response = await apiClient.get<{
      success: boolean;
      data: CheckInApi[];
      total: number;
      total_pages: number;
    }>(url);

    if (!response.success || !response.data) {
      return { checkIns: [], total: 0, totalPages: 0 };
    }

    return {
      checkIns: response.data.map(mapApiCheckIn),
      total: response.total,
      totalPages: response.total_pages,
    };
  }

  // Get user's check-in history
  async getUserCheckInHistory(userId: string, page: number = 1, limit: number = 20): Promise<{
    checkIns: CheckIn[];
    total: number;
    totalPages: number;
  }> {
    const response = await apiClient.get<{
      success: boolean;
      data: CheckInApi[];
      total: number;
      total_pages: number;
    }>(`/api/checkins/user/${userId}?page=${page}&limit=${limit}`);

    if (!response.success || !response.data) {
      return { checkIns: [], total: 0, totalPages: 0 };
    }

    return {
      checkIns: response.data.map(mapApiCheckIn),
      total: response.total,
      totalPages: response.total_pages,
    };
  }

  // Check if user has a valid birthday pass (staff/admin)
  async checkBirthdayPass(userId?: string, familyMemberId?: string): Promise<BirthdayPass | null> {
    let url = '';
    if (userId) {
      url = `/api/checkins/birthday-pass/user/${userId}`;
    } else if (familyMemberId) {
      url = `/api/checkins/birthday-pass/family-member/${familyMemberId}`;
    } else {
      return null;
    }

    try {
      const response = await apiClient.get<ApiResponse<BirthdayPass> & { hasBirthdayPass: boolean }>(url);
      if (response.success && response.hasBirthdayPass && response.data) {
        return response.data;
      }
    } catch {
      return null;
    }
    return null;
  }

  // Get today's check-in count
  async getTodayCount(): Promise<number> {
    try {
      const response = await apiClient.get<ApiResponse<{ count: number }>>('/api/checkins/count/today');
      if (response.success && response.data) {
        return response.data.count;
      }
    } catch {
      return 0;
    }
    return 0;
  }

  // Get customer check-in status (is birthday today, has checked in today)
  async getCustomerStatus(userId?: string, familyMemberId?: string): Promise<{
    isBirthdayToday: boolean;
    hasCheckedInToday: boolean;
  }> {
    let url = '';
    if (userId) {
      url = `/api/checkins/status/user/${userId}`;
    } else if (familyMemberId) {
      url = `/api/checkins/status/family-member/${familyMemberId}`;
    } else {
      return { isBirthdayToday: false, hasCheckedInToday: false };
    }

    try {
      const response = await apiClient.get<ApiResponse<{
        isBirthdayToday: boolean;
        hasCheckedInToday: boolean;
      }>>(url);
      if (response.success && response.data) {
        return response.data;
      }
    } catch {
      return { isBirthdayToday: false, hasCheckedInToday: false };
    }
    return { isBirthdayToday: false, hasCheckedInToday: false };
  }
}

export const checkInService = new CheckInService();