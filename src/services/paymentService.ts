/**
 * Payment Service
 * 
 * Handles payment processing with Square via backend API
 */

import { apiClient } from './apiClient';

export interface PaymentConfig {
  applicationId: string;
  locationId: string;
  environment: string;
  taxRate: number;
}

export interface PriceCalculation {
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  taxRate: number;
  subtotal: number;
  tax: number;
  total: number;
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  punchCardId?: string;
  squarePaymentId?: string;
  receiptUrl?: string;
  error?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class PaymentService {
  private config: PaymentConfig | null = null;

  /**
   * Get payment configuration from backend
   */
  async getConfig(): Promise<PaymentConfig> {
    if (this.config) {
      return this.config;
    }

    const response = await apiClient.get<ApiResponse<PaymentConfig>>('/api/payments/config');

    if (!response.success || !response.data) {
      throw new Error('Failed to get payment configuration');
    }

    this.config = response.data;
    return this.config;
  }

  /**
   * Calculate total with tax
   */
  async calculateTotal(subtotalCents: number): Promise<PriceCalculation> {
    const response = await apiClient.post<ApiResponse<PriceCalculation>>('/api/payments/calculate', {
      subtotalCents
    });

    if (!response.success || !response.data) {
      throw new Error('Failed to calculate total');
    }

    return response.data;
  }

  /**
   * Process payment with Square card token
   */
  async processPayment(
    sourceId: string,
    cardTypeId: string,
    amountCents: number,
    customerEmail?: string,
    tipCents?: number
  ): Promise<PaymentResult> {
    const response = await apiClient.post<ApiResponse<PaymentResult>>('/api/payments/process', {
      sourceId,
      cardTypeId,
      amountCents,
      customerEmail,
      tipCents: tipCents || 0
    });

    if (!response.success) {
      return {
        success: false,
        error: response.error || 'Payment failed'
      };
    }

    return response.data || { success: false, error: 'No response data' };
  }

  /**
   * Get payment history for current user
   */
  async getPaymentHistory(limit: number = 10) {
    const response = await apiClient.get<ApiResponse<any[]>>(`/api/payments/history?limit=${limit}`);
    return response.data || [];
  }

  /**
   * Get tax rate
   */
  async getTaxRate(): Promise<number> {
    const config = await this.getConfig();
    return config.taxRate;
  }

  /**
   * Get tip statistics (admin only)
   */
  async getTipStats(): Promise<{
    totalTips: number;
    thisMonthTips: number;
    tipCount: number;
    thisMonthTipCount: number;
  }> {
    const response = await apiClient.get<ApiResponse<any>>('/api/payments/tips/stats');
    return response.data || { totalTips: 0, thisMonthTips: 0, tipCount: 0, thisMonthTipCount: 0 };
  }

  /**
   * Format price for display
   */
  formatPrice(cents: number): string {
    return (cents / 100).toFixed(2);
  }
}

export const paymentService = new PaymentService();

