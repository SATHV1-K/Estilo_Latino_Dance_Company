import { supabaseAdmin } from '../../shared/supabase';
import { DashboardStats, RevenueByCardType, AttendanceTrend } from '../../shared/types';
import * as cardService from '../cards/cardService';
import * as checkInService from '../checkins/checkInService';

/**
 * Get dashboard stats for admin
 */
export async function getDashboardStats(): Promise<DashboardStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const firstOfMonthStr = firstOfMonth.toISOString().split('T')[0];

    // Get today's check-ins
    const todayCheckIns = await checkInService.getTodayCheckInCount();

    // Get active cards count
    const activeCards = await cardService.getActiveCardsCount();

    // Get new cards today
    const newCardsToday = await cardService.getCardsIssuedToday();

    // Get today's revenue
    const { data: todayPayments } = await supabaseAdmin
        .from('punch_cards')
        .select('amount_paid')
        .eq('purchase_date', todayStr);

    const totalRevenueToday = (todayPayments || []).reduce(
        (sum, p) => sum + Number(p.amount_paid),
        0
    );

    // Get this month's revenue
    const { data: monthPayments } = await supabaseAdmin
        .from('punch_cards')
        .select('amount_paid')
        .gte('purchase_date', firstOfMonthStr);

    const totalRevenueMonth = (monthPayments || []).reduce(
        (sum, p) => sum + Number(p.amount_paid),
        0
    );

    // Get new customers this month
    const { count: newCustomersMonth } = await supabaseAdmin
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'customer')
        .gte('created_at', firstOfMonthStr);

    // Get cards expiring within 7 days
    const expiringCards = await cardService.getCardsExpiringSoon(7);

    return {
        today_checkins: todayCheckIns,
        active_cards: activeCards,
        new_cards_today: newCardsToday,
        total_revenue_today: totalRevenueToday,
        total_revenue_month: totalRevenueMonth,
        new_customers_month: newCustomersMonth || 0,
        expiring_cards_week: expiringCards.length,
    };
}

/**
 * Get revenue breakdown by card type
 */
export async function getRevenueByCardType(): Promise<RevenueByCardType[]> {
    const { data, error } = await supabaseAdmin
        .from('punch_cards')
        .select(`
      amount_paid,
      card_types!inner (name)
    `);

    if (error) {
        throw new Error('Failed to fetch revenue data');
    }

    // Group by card type
    const grouped: Record<string, { total_sold: number; total_revenue: number }> = {};

    (data || []).forEach((card: any) => {
        const typeName = card.card_types?.name || 'Unknown';
        if (!grouped[typeName]) {
            grouped[typeName] = { total_sold: 0, total_revenue: 0 };
        }
        grouped[typeName].total_sold++;
        grouped[typeName].total_revenue += Number(card.amount_paid);
    });

    return Object.entries(grouped).map(([name, stats]) => ({
        card_type_name: name,
        ...stats,
    }));
}

/**
 * Get attendance trends for the last N days
 */
export async function getAttendanceTrends(days: number = 30): Promise<AttendanceTrend[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const { data, error } = await supabaseAdmin
        .from('check_ins')
        .select('checked_in_at')
        .gte('checked_in_at', startDate.toISOString());

    if (error) {
        throw new Error('Failed to fetch attendance data');
    }

    // Group by date
    const grouped: Record<string, number> = {};

    (data || []).forEach((checkin: any) => {
        const date = new Date(checkin.checked_in_at).toISOString().split('T')[0];
        grouped[date] = (grouped[date] || 0) + 1;
    });

    // Fill in missing dates with 0
    const result: AttendanceTrend[] = [];
    const currentDate = new Date(startDate);
    const endDate = new Date();

    while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        result.push({
            date: dateStr,
            checkins: grouped[dateStr] || 0,
        });
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return result;
}

/**
 * Get monthly analytics for the last N months
 */
export async function getMonthlyAnalytics(months: number = 6): Promise<{
    month: string;
    new_customers: number;
    total_checkins: number;
    revenue: number;
    new_cards: number;
}[]> {
    const results = [];
    const now = new Date();

    for (let i = 0; i < months; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

        const monthStr = date.toISOString().split('T')[0];
        const nextMonthStr = nextMonth.toISOString().split('T')[0];
        const monthName = date.toLocaleString('default', { month: 'short', year: '2-digit' });

        // New customers
        const { count: newCustomers } = await supabaseAdmin
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'customer')
            .gte('created_at', monthStr)
            .lt('created_at', nextMonthStr);

        // Check-ins
        const { count: totalCheckins } = await supabaseAdmin
            .from('check_ins')
            .select('*', { count: 'exact', head: true })
            .gte('checked_in_at', monthStr)
            .lt('checked_in_at', nextMonthStr);

        // Revenue and new cards
        const { data: cards } = await supabaseAdmin
            .from('punch_cards')
            .select('amount_paid')
            .gte('purchase_date', monthStr)
            .lt('purchase_date', nextMonthStr);

        const revenue = (cards || []).reduce((sum, c) => sum + Number(c.amount_paid), 0);

        results.push({
            month: monthName,
            new_customers: newCustomers || 0,
            total_checkins: totalCheckins || 0,
            revenue,
            new_cards: cards?.length || 0,
        });
    }

    return results.reverse();
}
