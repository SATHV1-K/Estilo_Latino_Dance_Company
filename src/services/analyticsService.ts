// Analytics Service - Handles dashboard and reporting data via real API

import { apiClient, ApiResponse } from './apiClient';
import { AnalyticsData } from './types';

// API response types
interface DashboardStatsApi {
  today_checkins: number;
  active_cards: number;
  new_cards_today: number;
  total_revenue_today: number;
  total_revenue_month: number;
  new_customers_month: number;
  expiring_cards_week: number;
}

interface RevenueByCardTypeApi {
  card_type_name: string;
  total_sold: number;
  total_revenue: number;
}

interface AttendanceTrendApi {
  date: string;
  checkins: number;
}

interface MonthlyAnalyticsApi {
  month: string;
  new_customers: number;
  total_checkins: number;
  revenue: number;
  new_cards: number;
}

// Frontend types
export interface DashboardStats {
  todayCheckins: number;
  activeCards: number;
  newCardsToday: number;
  totalRevenueToday: number;
  totalRevenueMonth: number;
  newCustomersMonth: number;
  expiringCardsWeek: number;
}

export interface RevenueByCardType {
  cardTypeName: string;
  totalSold: number;
  totalRevenue: number;
}

export interface AttendanceTrend {
  date: string;
  checkIns: number;
}

class AnalyticsService {
  // Get dashboard stats (admin only)
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await apiClient.get<ApiResponse<DashboardStatsApi>>('/api/analytics/dashboard');

    if (!response.success || !response.data) {
      throw new Error('Failed to fetch dashboard stats');
    }

    const d = response.data;
    return {
      todayCheckins: d.today_checkins,
      activeCards: d.active_cards,
      newCardsToday: d.new_cards_today,
      totalRevenueToday: d.total_revenue_today,
      totalRevenueMonth: d.total_revenue_month,
      newCustomersMonth: d.new_customers_month,
      expiringCardsWeek: d.expiring_cards_week,
    };
  }

  // Get revenue breakdown by card type (admin only)
  async getRevenueByCardType(): Promise<RevenueByCardType[]> {
    const response = await apiClient.get<ApiResponse<RevenueByCardTypeApi[]>>('/api/analytics/revenue');

    if (!response.success || !response.data) {
      return [];
    }

    return response.data.map(r => ({
      cardTypeName: r.card_type_name,
      totalSold: r.total_sold,
      totalRevenue: r.total_revenue,
    }));
  }

  // Get attendance trends (admin only)
  async getAttendanceTrends(days: number = 30): Promise<AttendanceTrend[]> {
    const response = await apiClient.get<ApiResponse<AttendanceTrendApi[]>>(`/api/analytics/attendance?days=${days}`);

    if (!response.success || !response.data) {
      return [];
    }

    return response.data.map(a => ({
      date: a.date,
      checkIns: a.checkins,
    }));
  }

  // Get monthly analytics (admin only)
  async getMonthlyAnalytics(months: number = 6): Promise<AnalyticsData[]> {
    const response = await apiClient.get<ApiResponse<MonthlyAnalyticsApi[]>>(`/api/analytics/monthly?months=${months}`);

    if (!response.success || !response.data) {
      return [];
    }

    return response.data.map(m => ({
      month: m.month,
      newCustomers: m.new_customers,
      attendance: m.total_checkins,
      revenue: m.revenue,
      activeCards: m.new_cards, // Using new_cards as proxy
    }));
  }

  // Get current month stats for dashboard
  async getCurrentMonthStats(): Promise<{
    totalRevenue: number;
    newCustomers: number;
    totalCheckIns: number;
    activeCards: number;
  }> {
    try {
      const stats = await this.getDashboardStats();
      return {
        totalRevenue: stats.totalRevenueMonth,
        newCustomers: stats.newCustomersMonth,
        totalCheckIns: stats.todayCheckins,
        activeCards: stats.activeCards,
      };
    } catch {
      return {
        totalRevenue: 0,
        newCustomers: 0,
        totalCheckIns: 0,
        activeCards: 0,
      };
    }
  }
}

export const analyticsService = new AnalyticsService();
