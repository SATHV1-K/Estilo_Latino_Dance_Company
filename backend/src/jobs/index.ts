import cron from 'node-cron';
import { supabaseAdmin } from '../shared/supabase';
import * as cardService from '../services/cards/cardService';

// Timezone for cron jobs (Eastern Time)
const TIMEZONE = process.env.STUDIO_TIMEZONE || 'America/New_York';

/**
 * Start all scheduled jobs
 */
export function startScheduledJobs() {
    console.log('🕐 Starting scheduled jobs...');

    // Daily job at 8:00 AM - Birthday notifications and expiration reminders
    cron.schedule('0 8 * * *', async () => {
        console.log('[CRON] Running morning notifications job...');
        await runMorningNotifications();
    }, { timezone: TIMEZONE });

    // Daily job at midnight - Expire cards and birthday passes
    cron.schedule('0 0 * * *', async () => {
        console.log('[CRON] Running midnight cleanup job...');
        await runMidnightCleanup();
    }, { timezone: TIMEZONE });

    // Every 6 hours - Check for low balance and expiring cards
    cron.schedule('0 */6 * * *', async () => {
        console.log('[CRON] Running balance check job...');
        await runBalanceChecks();
    }, { timezone: TIMEZONE });

    console.log('✅ Scheduled jobs started successfully');
}

/**
 * Morning notifications - birthdays and expiration reminders
 */
async function runMorningNotifications() {
    try {
        // Find users with birthdays today
        await createBirthdayPasses();

        // Send expiration reminders (7 days, 3 days, 1 day)
        await sendExpirationReminders(7);
        await sendExpirationReminders(3);
        await sendExpirationReminders(1);
    } catch (error) {
        console.error('[CRON] Morning notifications error:', error);
    }
}

/**
 * Midnight cleanup - expire cards and birthday passes
 */
async function runMidnightCleanup() {
    try {
        // Expire punch cards past their expiration date
        const expiredCount = await cardService.expireCards();
        console.log(`[CRON] Expired ${expiredCount} punch cards`);

        // Expire unused birthday passes from yesterday
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        await supabaseAdmin
            .from('birthday_passes')
            .delete()
            .eq('valid_date', yesterdayStr)
            .eq('used', false);

    } catch (error) {
        console.error('[CRON] Midnight cleanup error:', error);
    }
}

/**
 * Balance checks - low balance alerts
 */
async function runBalanceChecks() {
    try {
        const lowBalanceCards = await cardService.getLowBalanceCards();
        console.log(`[CRON] Found ${lowBalanceCards.length} low balance cards`);

        // TODO: Send notifications for low balance cards
        // This will be implemented when notification service is complete
    } catch (error) {
        console.error('[CRON] Balance check error:', error);
    }
}

/**
 * Create birthday passes for users with birthdays today
 */
async function createBirthdayPasses() {
    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();

    // Find users with birthday today
    const { data: users } = await supabaseAdmin
        .from('users')
        .select('id, first_name, last_name, email, phone')
        .eq('role', 'customer')
        .not('birthday', 'is', null);

    const birthdayUsers = (users || []).filter((u: any) => {
        if (!u.birthday) return false;
        const bday = new Date(u.birthday);
        return bday.getMonth() + 1 === month && bday.getDate() === day;
    });

    // Find family members with birthday today
    const { data: members } = await supabaseAdmin
        .from('family_members')
        .select('id, first_name, last_name, primary_user_id')
        .not('birthday', 'is', null);

    const birthdayMembers = (members || []).filter((m: any) => {
        if (!m.birthday) return false;
        const bday = new Date(m.birthday);
        return bday.getMonth() + 1 === month && bday.getDate() === day;
    });

    console.log(`[CRON] Found ${birthdayUsers.length} users and ${birthdayMembers.length} family members with birthdays today`);

    // Create birthday passes - expires at end of today
    const todayStr = today.toISOString().split('T')[0];
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    // Create passes for users
    for (const user of birthdayUsers) {
        try {
            // Check if pass already exists
            const { data: existing } = await supabaseAdmin
                .from('birthday_passes')
                .select('id')
                .eq('user_id', user.id)
                .eq('valid_date', todayStr)
                .single();

            if (!existing) {
                await supabaseAdmin
                    .from('birthday_passes')
                    .insert({
                        user_id: user.id,
                        valid_date: todayStr,
                        expires_at: endOfDay.toISOString(),
                        used: false,
                    });
                console.log(`[CRON] Created birthday pass for user: ${user.first_name} ${user.last_name}`);

                // TODO: Send birthday notification
            }
        } catch (err) {
            console.error(`[CRON] Error creating birthday pass for user ${user.id}:`, err);
        }
    }

    // Create passes for family members
    for (const member of birthdayMembers) {
        try {
            const { data: existing } = await supabaseAdmin
                .from('birthday_passes')
                .select('id')
                .eq('family_member_id', member.id)
                .eq('valid_date', todayStr)
                .single();

            if (!existing) {
                await supabaseAdmin
                    .from('birthday_passes')
                    .insert({
                        family_member_id: member.id,
                        valid_date: todayStr,
                        expires_at: endOfDay.toISOString(),
                        used: false,
                    });
                console.log(`[CRON] Created birthday pass for family member: ${member.first_name} ${member.last_name}`);

                // TODO: Send birthday notification to parent
            }
        } catch (err) {
            console.error(`[CRON] Error creating birthday pass for family member ${member.id}:`, err);
        }
    }
}

/**
 * Send expiration reminders for cards expiring in N days
 */
async function sendExpirationReminders(daysUntilExpiry: number) {
    try {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + daysUntilExpiry);
        const targetDateStr = targetDate.toISOString().split('T')[0];

        const { data: expiringCards } = await supabaseAdmin
            .from('punch_cards')
            .select(`
        *,
        users!punch_cards_user_id_fkey (first_name, last_name, email, phone),
        family_members!punch_cards_family_member_id_fkey (
          first_name, 
          last_name,
          primary_user_id
        )
      `)
            .eq('status', 'active')
            .eq('expiration_date', targetDateStr);

        console.log(`[CRON] Found ${expiringCards?.length || 0} cards expiring in ${daysUntilExpiry} days`);

        // TODO: Send expiration reminder notifications
        // This will be implemented when notification service is complete
    } catch (error) {
        console.error('[CRON] Expiration reminder error:', error);
    }
}

export default { startScheduledJobs };
