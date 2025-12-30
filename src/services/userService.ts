// User Service - Handles user and family member operations via real API

import { apiClient, ApiResponse, PaginatedResponse } from './apiClient';
import { User, UserRole } from './types';

// API response types
interface UserApi {
  id: string;
  email: string;
  phone: string | null;
  role: UserRole;
  first_name: string;
  last_name: string;
  birthday: string | null;
  qr_code: string | null;
  email_verified: boolean;
  created_at: string;
}

interface FamilyMemberApi {
  id: string;
  primary_user_id: string;
  first_name: string;
  last_name: string;
  birthday: string | null;
  qr_code: string | null;
  has_waiver: boolean;
  created_at: string;
}

// Frontend family member type
export interface FamilyMember {
  id: string;
  primaryUserId: string;
  firstName: string;
  lastName: string;
  birthday?: string;
  qrCode?: string;
  hasWaiver: boolean;
  createdAt: string;
}

// Convert API types to frontend types
function mapApiUserToUser(apiUser: UserApi): User {
  return {
    id: apiUser.id,
    firstName: apiUser.first_name,
    lastName: apiUser.last_name,
    email: apiUser.email,
    phone: apiUser.phone || '',
    role: apiUser.role,
    createdAt: apiUser.created_at,
    qrCode: apiUser.qr_code || undefined,
    birthday: apiUser.birthday || undefined,
  };
}

function mapApiFamilyMember(fm: FamilyMemberApi): FamilyMember {
  return {
    id: fm.id,
    primaryUserId: fm.primary_user_id,
    firstName: fm.first_name,
    lastName: fm.last_name,
    birthday: fm.birthday || undefined,
    qrCode: fm.qr_code || undefined,
    hasWaiver: fm.has_waiver,
    createdAt: fm.created_at,
  };
}

class UserService {
  // Get all customers (admin only)
  async getAllCustomers(page: number = 1, limit: number = 20): Promise<{
    users: User[];
    total: number;
    totalPages: number;
  }> {
    const response = await apiClient.get<PaginatedResponse<UserApi>>(`/api/users?page=${page}&limit=${limit}`);

    return {
      users: response.data.map(mapApiUserToUser),
      total: response.total,
      totalPages: response.total_pages,
    };
  }

  // Get user by ID
  async getUserById(userId: string): Promise<User | null> {
    try {
      const response = await apiClient.get<ApiResponse<UserApi>>(`/api/users/${userId}`);
      if (response.success && response.data) {
        return mapApiUserToUser(response.data);
      }
    } catch {
      return null;
    }
    return null;
  }

  // Update user profile
  async updateUser(userId: string, data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    birthday?: string;
  }): Promise<User> {
    const response = await apiClient.put<ApiResponse<UserApi>>(`/api/users/${userId}`, {
      first_name: data.firstName,
      last_name: data.lastName,
      phone: data.phone,
      birthday: data.birthday,
    });

    if (!response.success || !response.data) {
      throw new Error('Failed to update user');
    }

    return mapApiUserToUser(response.data);
  }

  // Delete user (admin only)
  async deleteUser(userId: string): Promise<boolean> {
    try {
      const response = await apiClient.delete<ApiResponse<null>>(`/api/users/${userId}`);
      return response.success;
    } catch {
      return false;
    }
  }

  // Get family members for a user
  async getFamilyMembers(userId: string): Promise<FamilyMember[]> {
    try {
      const response = await apiClient.get<ApiResponse<FamilyMemberApi[]>>(`/api/users/${userId}/family-members`);
      if (response.success && response.data) {
        return response.data.map(mapApiFamilyMember);
      }
    } catch {
      return [];
    }
    return [];
  }

  // Add a family member
  async addFamilyMember(userId: string, data: {
    firstName: string;
    lastName: string;
    birthday?: string;
  }): Promise<FamilyMember> {
    const response = await apiClient.post<ApiResponse<FamilyMemberApi>>(`/api/users/${userId}/family-members`, {
      first_name: data.firstName,
      last_name: data.lastName,
      birthday: data.birthday,
    });

    if (!response.success || !response.data) {
      throw new Error('Failed to add family member');
    }

    return mapApiFamilyMember(response.data);
  }

  // Update a family member
  async updateFamilyMember(memberId: string, data: {
    firstName?: string;
    lastName?: string;
    birthday?: string;
  }): Promise<FamilyMember> {
    const response = await apiClient.put<ApiResponse<FamilyMemberApi>>(`/api/users/family-members/${memberId}`, {
      first_name: data.firstName,
      last_name: data.lastName,
      birthday: data.birthday,
    });

    if (!response.success || !response.data) {
      throw new Error('Failed to update family member');
    }

    return mapApiFamilyMember(response.data);
  }

  // Delete a family member
  async deleteFamilyMember(memberId: string): Promise<boolean> {
    try {
      const response = await apiClient.delete<ApiResponse<null>>(`/api/users/family-members/${memberId}`);
      return response.success;
    } catch {
      return false;
    }
  }

  // Create a new customer (admin only)
  async createCustomer(data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  }): Promise<User> {
    const response = await apiClient.post<ApiResponse<UserApi>>('/api/users', {
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      phone: data.phone,
      role: 'customer',
    });

    if (!response.success || !response.data) {
      throw new Error('Failed to create customer');
    }

    return mapApiUserToUser(response.data);
  }

  // Delete customer alias (same as deleteUser)
  async deleteCustomer(userId: string): Promise<boolean> {
    return this.deleteUser(userId);
  }
}

export const userService = new UserService();
