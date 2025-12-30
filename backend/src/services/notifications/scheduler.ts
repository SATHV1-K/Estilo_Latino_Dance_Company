// Notification Scheduler - Daily cron job for automated notifications
import cron from 'node-cron';
import { runDailyNotifications } from './notificationService';

let schedulerInitialized = false;

/**
 * Initialize the notification scheduler
 * Runs daily at 9:00 AM Eastern Time
 */
export function initializeScheduler(): void {
    if (schedulerInitialized) {
        console.log('⏰ Scheduler already initialized');
        return;
    }

    // Schedule for 9:00 AM every day
    // Cron format: minute hour day-of-month month day-of-week
    cron.schedule('0 9 * * *', async () => {
        console.log('⏰ Running scheduled daily notifications...');
        const startTime = Date.now();

        try {
            const results = await runDailyNotifications();
            const duration = ((Date.now() - startTime) / 1000).toFixed(2);

            console.log(`✅ Daily notifications completed in ${duration}s:`, {
                lowBalance: results.lowBalanceCount,
                expiring: results.expiringCount,
                expired: results.expiredCount,
                birthdays: results.birthdayCount
            });
        } catch (error) {
            console.error('❌ Daily notifications failed:', error);
        }
    }, {
        timezone: process.env.STUDIO_TIMEZONE || 'America/New_York'
    });

    schedulerInitialized = true;
    console.log('✅ Notification scheduler initialized (runs daily at 9:00 AM ET)');
}

/**
 * Run notifications manually (for testing or admin trigger)
 */
export async function runNotificationsNow(): Promise<{
    lowBalanceCount: number;
    expiringCount: number;
    expiredCount: number;
    birthdayCount: number;
}> {
    console.log('🔔 Running notifications manually...');
    return await runDailyNotifications();
}
