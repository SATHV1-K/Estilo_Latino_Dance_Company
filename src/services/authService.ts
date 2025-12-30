// Authentication Service - Handles user authentication using real backend API

import { apiClient, ApiResponse } from './apiClient';
import { User, UserRole } from './types';

// API response types
interface AuthResponse {
  user: {
    id: string;
    email: string;
    phone: string | null;
    role: UserRole;
    first_name: string;
    last_name: string;
    birthday: string | null;
    qr_code: string | null;
    check_in_code: string | null;
    email_verified: boolean;
    created_at: string;
  };
  accessToken: string;
}

// Convert API user to frontend User type
function mapApiUserToUser(apiUser: AuthResponse['user']): User {
  return {
    id: apiUser.id,
    firstName: apiUser.first_name,
    lastName: apiUser.last_name,
    email: apiUser.email,
    phone: apiUser.phone || '',
    role: apiUser.role,
    createdAt: apiUser.created_at,
    qrCode: apiUser.qr_code || undefined,
    checkInCode: apiUser.check_in_code || undefined,
    birthday: apiUser.birthday || undefined,
  };
}

class AuthService {
  private currentUser: User | null = null;

  constructor() {
    // Try to restore user from localStorage
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        this.currentUser = JSON.parse(savedUser);
      } catch {
        localStorage.removeItem('currentUser');
      }
    }
  }

  async login(
    email: string,
    password: string,
    loginType: 'customer' | 'staff' = 'customer'
  ): Promise<{ user: User; token: string }> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/api/auth/login', {
      email,
      password,
      loginType,
    });

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Login failed');
    }

    const user = mapApiUserToUser(response.data.user);
    const token = response.data.accessToken;

    // Store token and user
    apiClient.setAccessToken(token);
    this.currentUser = user;
    localStorage.setItem('currentUser', JSON.stringify(user));

    return { user, token };
  }

  async signUp(data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
    birthday?: string;
  }): Promise<{ user: User; token: string }> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/api/auth/register', {
      email: data.email,
      password: data.password,
      first_name: data.firstName,
      last_name: data.lastName,
      phone: data.phone,
      birthday: data.birthday,
    });

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Registration failed');
    }

    const user = mapApiUserToUser(response.data.user);
    const token = response.data.accessToken;

    // Store token and user
    apiClient.setAccessToken(token);
    this.currentUser = user;
    localStorage.setItem('currentUser', JSON.stringify(user));

    return { user, token };
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post('/api/auth/logout');
    } catch {
      // Ignore logout errors
    }

    apiClient.setAccessToken(null);
    this.currentUser = null;
    localStorage.removeItem('currentUser');
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  async refreshCurrentUser(): Promise<User | null> {
    try {
      const response = await apiClient.get<ApiResponse<AuthResponse['user']>>('/api/auth/me');
      if (response.success && response.data) {
        const user = mapApiUserToUser(response.data);
        this.currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        return user;
      }
    } catch {
      // If refresh fails, clear user
      this.currentUser = null;
      localStorage.removeItem('currentUser');
    }
    return null;
  }

  async forgotPassword(email: string): Promise<void> {
    const response = await apiClient.post<ApiResponse<null>>('/api/auth/forgot-password', {
      email,
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to send reset email');
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const response = await apiClient.post<ApiResponse<null>>('/api/auth/reset-password', {
      token,
      password: newPassword,
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to reset password');
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const response = await apiClient.post<ApiResponse<null>>('/api/auth/change-password', {
      currentPassword,
      newPassword,
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to change password');
    }
  }

  async updateProfile(data: {
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  }): Promise<User> {
    const response = await apiClient.put<ApiResponse<{ user: AuthResponse['user'] }>>('/api/auth/profile', data);

    if (!response.success || !response.data?.user) {
      throw new Error(response.error || 'Failed to update profile');
    }

    // Update local user state
    this.currentUser = mapApiUserToUser(response.data.user);
    localStorage.setItem('currentUser', JSON.stringify(this.currentUser));

    return this.currentUser;
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null && apiClient.getAccessToken() !== null;
  }

  isStaffOrAdmin(): boolean {
    return this.currentUser?.role === 'staff' || this.currentUser?.role === 'admin';
  }

  isAdmin(): boolean {
    return this.currentUser?.role === 'admin';
  }
}

export const authService = new AuthService();
