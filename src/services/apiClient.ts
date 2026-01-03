// API Client Configuration - Handles all HTTP requests to the backend

const API_BASE_URL = (import.meta as unknown as { env: Record<string, string> }).env?.VITE_API_URL || 'http://localhost:3001';

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

interface PaginatedResponse<T> {
    success: boolean;
    data: T[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
}

class ApiClient {
    private accessToken: string | null = null;

    constructor() {
        // Load token from localStorage on init
        this.accessToken = localStorage.getItem('accessToken');
    }

    setAccessToken(token: string | null) {
        this.accessToken = token;
        if (token) {
            localStorage.setItem('accessToken', token);
        } else {
            localStorage.removeItem('accessToken');
        }
    }

    getAccessToken(): string | null {
        return this.accessToken;
    }

    hasToken(): boolean {
        return !!this.accessToken;
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${API_BASE_URL}${endpoint}`;

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (this.accessToken) {
            (headers as Record<string, string>)['Authorization'] = `Bearer ${this.accessToken}`;
        }

        const response = await fetch(url, {
            ...options,
            headers,
            credentials: 'include', // Include cookies for refresh token
        });

        const data = await response.json();

        if (!response.ok) {
            // If 401, try to refresh token
            if (response.status === 401 && endpoint !== '/api/auth/refresh') {
                const refreshed = await this.refreshToken();
                if (refreshed) {
                    // Retry the original request
                    return this.request<T>(endpoint, options);
                }
            }
            throw new Error(data.error || 'An error occurred');
        }

        return data;
    }

    private async refreshToken(): Promise<boolean> {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
                method: 'POST',
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                if (data.data?.accessToken) {
                    this.setAccessToken(data.data.accessToken);
                    return true;
                }
            }
            // If refresh fails, clear token
            this.setAccessToken(null);
            return false;
        } catch {
            this.setAccessToken(null);
            return false;
        }
    }

    // GET request
    async get<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: 'GET' });
    }

    // POST request
    async post<T>(endpoint: string, body?: unknown): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: body ? JSON.stringify(body) : undefined,
        });
    }

    // PUT request
    async put<T>(endpoint: string, body?: unknown): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'PUT',
            body: body ? JSON.stringify(body) : undefined,
        });
    }

    // DELETE request
    async delete<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: 'DELETE' });
    }
}

export const apiClient = new ApiClient();
export type { ApiResponse, PaginatedResponse };
