// Notification Service - Handles all email notifications for the Dance Studio
import { Resend } from 'resend';
import { supabaseAdmin } from '../../shared/supabase';
import * as userService from '../users/userService';

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

const STUDIO_NAME = 'Estilo Latino Dance Company';
const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev'; // Use Resend's default or your verified domain
const STUDIO_EMAIL = process.env.STUDIO_EMAIL || 'info@estilolatino.com';

// Helper function to send emails via Resend
async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    try {
        const { data, error } = await resend.emails.send({
            from: `${STUDIO_NAME} <${FROM_EMAIL}>`,
            to: [to],
            subject,
            html
        });

        if (error) {
            console.error('❌ Resend error:', error);
            return false;
        }

        console.log(`✅ Email sent via Resend to ${to}, ID: ${data?.id}`);
        return true;
    } catch (error) {
        console.error('❌ Error sending email via Resend:', error);
        return false;
    }
}

// ============================================
// LOW BALANCE NOTIFICATION (≤2 classes remaining)
// ============================================

export async function sendLowBalanceAlert(
    userId: string,
    userName: string,
    userEmail: string,
    classesRemaining: number,
    cardName: string
): Promise<boolean> {
    try {
        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ffc700, #e6b400); padding: 30px; text-align: center; }
        .header h1 { color: #000; margin: 0; }
        .content { padding: 30px; background: #f9f9f9; }
        .alert-box { background: #fff3cd; border: 1px solid #ffc107; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .classes-count { font-size: 48px; font-weight: bold; color: #e6b400; text-align: center; }
        .button { display: inline-block; padding: 12px 30px; background: #ffc700; color: #000; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 20px; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⚠️ Low Balance Alert</h1>
        </div>
        <div class="content">
            <p>Hi <strong>${userName.split(' ')[0]}</strong>,</p>
            
            <div class="alert-box">
                <p style="text-align: center; margin: 0;">Your <strong>${cardName}</strong> is running low!</p>
                <p class="classes-count">${classesRemaining}</p>
                <p style="text-align: center; margin: 0;">class${classesRemaining === 1 ? '' : 'es'} remaining</p>
            </div>
            
            <p>Don't let your dance journey stop! Purchase a new punch card to keep learning and grooving with us.</p>
            
            <p style="text-align: center;">
                <a href="#" class="button">Buy New Card</a>
            </p>
            
            <p>We can't wait to see you on the dance floor! 💃🕺</p>
            
            <p><em>The Estilo Latino Team</em></p>
        </div>
        <div class="footer">
            <p>${STUDIO_NAME}<br>
            📧 ${STUDIO_EMAIL}</p>
        </div>
    </div>
</body>
</html>`;

        const subject = `⚠️ Low Balance: ${classesRemaining} class${classesRemaining === 1 ? '' : 'es'} remaining`;
        const success = await sendEmail(userEmail, subject, html);

        if (success) {
            console.log(`✅ Low balance alert sent to ${userEmail} (${classesRemaining} classes remaining)`);
        }
        return success;
    } catch (error) {
        console.error('❌ Error sending low balance alert:', error);
        return false;
    }
}

// ============================================
// EXPIRATION REMINDER (3, 1 days before)
// ============================================

export async function sendExpirationReminder(
    userId: string,
    userName: string,
    userEmail: string,
    cardName: string,
    expirationDate: string,
    daysRemaining: number
): Promise<boolean> {
    try {
        const urgencyColor = daysRemaining === 1 ? '#dc3545' : '#ffc107';
        const urgencyText = daysRemaining === 1 ? 'EXPIRES TOMORROW!' : `Expires in ${daysRemaining} days`;

        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: ${urgencyColor}; padding: 30px; text-align: center; }
        .header h1 { color: #fff; margin: 0; }
        .content { padding: 30px; background: #f9f9f9; }
        .expiry-box { background: #fff; border: 2px solid ${urgencyColor}; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
        .days-count { font-size: 48px; font-weight: bold; color: ${urgencyColor}; }
        .button { display: inline-block; padding: 12px 30px; background: #ffc700; color: #000; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 20px; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⏰ ${urgencyText}</h1>
        </div>
        <div class="content">
            <p>Hi <strong>${userName.split(' ')[0]}</strong>,</p>
            
            <div class="expiry-box">
                <p style="margin: 0;">Your <strong>${cardName}</strong></p>
                <p class="days-count">${daysRemaining}</p>
                <p style="margin: 0;">day${daysRemaining === 1 ? '' : 's'} until expiration</p>
                <p style="color: #666; font-size: 14px; margin-top: 10px;">Expires: ${new Date(expirationDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            
            <p>Make sure to use your remaining classes before your card expires! Any unused classes will be lost after the expiration date.</p>
            
            <p>Check our schedule and book your classes today!</p>
            
            <p><em>The Estilo Latino Team</em></p>
        </div>
        <div class="footer">
            <p>${STUDIO_NAME}<br>
            📧 ${STUDIO_EMAIL}</p>
        </div>
    </div>
</body>
</html>`;

        const subject = `⏰ ${urgencyText} - ${cardName}`;
        const success = await sendEmail(userEmail, subject, html);

        if (success) {
            console.log(`✅ Expiration reminder sent to ${userEmail} (${daysRemaining} days remaining)`);
        }
        return success;
    } catch (error) {
        console.error('❌ Error sending expiration reminder:', error);
        return false;
    }
}

// ============================================
// CARD EXPIRED NOTIFICATION
// ============================================

export async function sendExpiredNotification(
    userId: string,
    userName: string,
    userEmail: string,
    cardName: string,
    classesLost: number
): Promise<boolean> {
    try {
        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc3545; padding: 30px; text-align: center; }
        .header h1 { color: #fff; margin: 0; }
        .content { padding: 30px; background: #f9f9f9; }
        .expired-box { background: #f8d7da; border: 1px solid #dc3545; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
        .button { display: inline-block; padding: 12px 30px; background: #ffc700; color: #000; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 20px; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>❌ Card Expired</h1>
        </div>
        <div class="content">
            <p>Hi <strong>${userName.split(' ')[0]}</strong>,</p>
            
            <div class="expired-box">
                <p style="margin: 0;">Your <strong>${cardName}</strong> has expired.</p>
                ${classesLost > 0 ? `<p style="color: #dc3545; margin-top: 10px;">${classesLost} unused class${classesLost === 1 ? '' : 'es'} were lost.</p>` : ''}
            </div>
            
            <p>But don't worry! You can purchase a new punch card anytime to continue your dance journey with us.</p>
            
            <p style="text-align: center;">
                <a href="#" class="button">Get a New Card</a>
            </p>
            
            <p>We hope to see you back on the dance floor soon! 💃</p>
            
            <p><em>The Estilo Latino Team</em></p>
        </div>
        <div class="footer">
            <p>${STUDIO_NAME}<br>
            📧 ${STUDIO_EMAIL}</p>
        </div>
    </div>
</body>
</html>`;

        const subject = `❌ Your ${cardName} has expired`;
        const success = await sendEmail(userEmail, subject, html);

        if (success) {
            console.log(`✅ Expired notification sent to ${userEmail}`);
        }
        return success;
    } catch (error) {
        console.error('❌ Error sending expired notification:', error);
        return false;
    }
}

// ============================================
// BIRTHDAY NOTIFICATION
// ============================================

export async function sendBirthdayNotification(
    userId: string,
    userName: string,
    userEmail: string
): Promise<boolean> {
    try {
        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ff69b4, #ff1493); padding: 40px; text-align: center; }
        .header h1 { color: #fff; margin: 0; font-size: 32px; }
        .content { padding: 30px; background: #fff0f5; }
        .gift-box { background: #fff; border: 3px solid #ff69b4; padding: 30px; border-radius: 15px; margin: 20px 0; text-align: center; }
        .gift-icon { font-size: 64px; }
        .gift-text { font-size: 24px; color: #ff1493; font-weight: bold; margin: 15px 0; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎂 Happy Birthday! 🎉</h1>
        </div>
        <div class="content">
            <p style="font-size: 18px;">Dear <strong>${userName.split(' ')[0]}</strong>,</p>
            
            <div class="gift-box">
                <p class="gift-icon">🎁</p>
                <p class="gift-text">FREE Dance Class!</p>
                <p>As our birthday gift to you, enjoy a <strong>FREE class</strong> today!</p>
                <p style="color: #666; font-size: 14px;">Just let our staff know it's your birthday when you check in.</p>
            </div>
            
            <p>Wishing you a fantastic birthday filled with joy, laughter, and of course... dancing! 💃🕺</p>
            
            <p>We hope to celebrate with you at the studio today!</p>
            
            <p><em>With love,<br>The Estilo Latino Family</em></p>
        </div>
        <div class="footer">
            <p>${STUDIO_NAME}<br>
            📧 ${STUDIO_EMAIL}</p>
        </div>
    </div>
</body>
</html>`;

        const subject = `🎂 Happy Birthday ${userName.split(' ')[0]}! Here's a FREE class for you!`;
        const success = await sendEmail(userEmail, subject, html);

        if (success) {
            console.log(`✅ Birthday notification sent to ${userEmail}`);
        }
        return success;
    } catch (error) {
        console.error('❌ Error sending birthday notification:', error);
        return false;
    }
}

// ============================================
// CHECK AND SEND ALL SCHEDULED NOTIFICATIONS
// ============================================

export async function runDailyNotifications(): Promise<{
    lowBalanceCount: number;
    expiringCount: number;
    expiredCount: number;
    birthdayCount: number;
}> {
    console.log('🔔 Running daily notification check...');

    const results = {
        lowBalanceCount: 0,
        expiringCount: 0,
        expiredCount: 0,
        birthdayCount: 0
    };

    try {
        // 1. Check for expiring cards (3 and 1 days)
        await checkExpiringCards(results);

        // 2. Check for expired cards (today)
        await checkExpiredCards(results);

        // 3. Check for birthdays
        await checkBirthdays(results);

        console.log('✅ Daily notifications completed:', results);
        return results;
    } catch (error) {
        console.error('❌ Error running daily notifications:', error);
        return results;
    }
}

async function checkExpiringCards(results: { expiringCount: number }): Promise<void> {
    const today = new Date();

    // Check for cards expiring in 3 days
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const threeDaysStr = threeDaysFromNow.toISOString().split('T')[0];

    // Check for cards expiring in 1 day (tomorrow)
    const oneDayFromNow = new Date(today);
    oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);
    const oneDayStr = oneDayFromNow.toISOString().split('T')[0];

    // Query cards expiring in 3 days
    const { data: cardsIn3Days } = await supabaseAdmin
        .from('punch_cards')
        .select(`
            *,
            users!punch_cards_user_id_fkey (id, email, first_name, last_name),
            card_types!punch_cards_card_type_id_fkey (name)
        `)
        .eq('status', 'active')
        .gte('expiration_date', threeDaysStr)
        .lt('expiration_date', threeDaysStr + 'T23:59:59');

    for (const card of cardsIn3Days || []) {
        if (card.users?.email) {
            const userName = `${card.users.first_name} ${card.users.last_name}`;
            await sendExpirationReminder(
                card.users.id,
                userName,
                card.users.email,
                card.card_types?.name || 'Punch Card',
                card.expiration_date,
                3
            );
            results.expiringCount++;
        }
    }

    // Query cards expiring in 1 day
    const { data: cardsIn1Day } = await supabaseAdmin
        .from('punch_cards')
        .select(`
            *,
            users!punch_cards_user_id_fkey (id, email, first_name, last_name),
            card_types!punch_cards_card_type_id_fkey (name)
        `)
        .eq('status', 'active')
        .gte('expiration_date', oneDayStr)
        .lt('expiration_date', oneDayStr + 'T23:59:59');

    for (const card of cardsIn1Day || []) {
        if (card.users?.email) {
            const userName = `${card.users.first_name} ${card.users.last_name}`;
            await sendExpirationReminder(
                card.users.id,
                userName,
                card.users.email,
                card.card_types?.name || 'Punch Card',
                card.expiration_date,
                1
            );
            results.expiringCount++;
        }
    }
}

async function checkExpiredCards(results: { expiredCount: number }): Promise<void> {
    const today = new Date().toISOString().split('T')[0];

    // Find cards that expired today and haven't been notified
    const { data: expiredCards } = await supabaseAdmin
        .from('punch_cards')
        .select(`
            *,
            users!punch_cards_user_id_fkey (id, email, first_name, last_name),
            card_types!punch_cards_card_type_id_fkey (name)
        `)
        .eq('status', 'active')
        .lt('expiration_date', today);

    for (const card of expiredCards || []) {
        if (card.users?.email) {
            const userName = `${card.users.first_name} ${card.users.last_name}`;
            await sendExpiredNotification(
                card.users.id,
                userName,
                card.users.email,
                card.card_types?.name || 'Punch Card',
                card.classes_remaining
            );

            // Update card status to expired
            await supabaseAdmin
                .from('punch_cards')
                .update({ status: 'expired' })
                .eq('id', card.id);

            results.expiredCount++;
        }
    }
}

async function checkBirthdays(results: { birthdayCount: number }): Promise<void> {
    const today = new Date();
    const todayMonth = today.getMonth() + 1;
    const todayDay = today.getDate();

    // Format for SQL comparison (MM-DD)
    const monthDay = `${String(todayMonth).padStart(2, '0')}-${String(todayDay).padStart(2, '0')}`;

    console.log(`[Birthday Notifications] Checking for birthdays on month-day: ${monthDay}`);

    // Query all customers (only customers should get birthday emails)
    const { data: allUsers, error } = await supabaseAdmin
        .from('users')
        .select('id, email, first_name, last_name, birthday, role')
        .eq('role', 'customer')
        .not('birthday', 'is', null);

    if (error) {
        console.error('[Birthday Notifications] Error querying users:', error);
        return;
    }

    console.log(`[Birthday Notifications] Found ${allUsers?.length || 0} customers with birthdays set`);

    for (const user of allUsers || []) {
        if (user.birthday && user.email) {
            // Extract month-day from birthday
            const birthdayMonthDay = user.birthday.substring(5); // Gets "MM-DD" from "YYYY-MM-DD"

            console.log(`[Birthday Notifications] User ${user.first_name} ${user.last_name} has birthday ${user.birthday} (${birthdayMonthDay}), checking against ${monthDay}`);

            if (birthdayMonthDay === monthDay) {
                console.log(`[Birthday Notifications] 🎂 MATCH! Sending birthday email to ${user.email}`);
                const userName = `${user.first_name} ${user.last_name}`;
                await sendBirthdayNotification(user.id, userName, user.email);
                results.birthdayCount++;
            }
        } else {
            console.log(`[Birthday Notifications] Skipping user ${user.first_name} ${user.last_name} - no birthday (${user.birthday}) or no email (${user.email})`);
        }
    }

    console.log(`[Birthday Notifications] Total birthday emails sent: ${results.birthdayCount}`);
}

/**
 * Send low balance alert after a check-in (called from check-in service)
 */
export async function checkAndSendLowBalanceAlert(
    userId: string | undefined,
    familyMemberId: string | undefined,
    classesRemaining: number,
    cardName: string
): Promise<void> {
    // Only send if 2 or fewer classes remaining
    if (classesRemaining > 2) return;

    try {
        let email: string | null = null;
        let userName = '';

        if (userId) {
            const user = await userService.getUserById(userId);
            if (user) {
                email = user.email;
                userName = `${user.first_name} ${user.last_name}`;
            }
        } else if (familyMemberId) {
            // For family members, get parent's email
            const member = await userService.getFamilyMemberById(familyMemberId);
            if (member) {
                const parent = await userService.getUserById(member.primary_user_id);
                if (parent) {
                    email = parent.email;
                    userName = `${member.first_name} ${member.last_name}`;
                }
            }
        }

        if (email && userName) {
            await sendLowBalanceAlert(
                userId || familyMemberId || '',
                userName,
                email,
                classesRemaining,
                cardName
            );
        }
    } catch (error) {
        console.error('Error checking/sending low balance alert:', error);
    }
}

// ============================================
// PURCHASE CONFIRMATION EMAIL
// ============================================

export async function sendPurchaseConfirmationEmail(
    userId: string,
    userName: string,
    userEmail: string,
    checkInCode: string,
    cardName: string,
    totalClasses: number,
    expirationDate: string,
    amountPaid: number
): Promise<boolean> {
    try {
        const formattedExpDate = new Date(expirationDate).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #28a745, #20c997); padding: 30px; text-align: center; }
        .header h1 { color: #fff; margin: 0; }
        .content { padding: 30px; background: #f9f9f9; }
        .success-box { background: #d4edda; border: 2px solid #28a745; padding: 25px; border-radius: 12px; margin: 20px 0; text-align: center; }
        .card-details { background: #fff; border: 1px solid #ddd; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .code-box { background: #ffc700; padding: 15px 30px; border-radius: 10px; display: inline-block; margin: 15px 0; }
        .code-text { font-size: 32px; font-weight: bold; color: #000; letter-spacing: 8px; font-family: monospace; }
        .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
        .detail-label { color: #666; }
        .detail-value { font-weight: bold; color: #333; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ Purchase Confirmed!</h1>
        </div>
        <div class="content">
            <p>Hi <strong>${userName.split(' ')[0]}</strong>,</p>
            
            <div class="success-box">
                <h2 style="color: #28a745; margin: 0;">Thank you for your purchase!</h2>
                <p style="margin: 10px 0 0 0;">Your punch card is now active and ready to use.</p>
            </div>
            
            <div class="card-details">
                <h3 style="margin-top: 0; color: #333;">📋 Card Details</h3>
                <div class="detail-row">
                    <span class="detail-label">Card Type</span>
                    <span class="detail-value">${cardName}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Classes</span>
                    <span class="detail-value">${totalClasses} classes</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Valid Until</span>
                    <span class="detail-value">${formattedExpDate}</span>
                </div>
                <div class="detail-row" style="border-bottom: none;">
                    <span class="detail-label">Amount Paid</span>
                    <span class="detail-value" style="color: #28a745;">$${amountPaid.toFixed(2)}</span>
                </div>
            </div>
            
            <div style="text-align: center; margin: 25px 0;">
                <p style="margin: 0 0 10px 0; color: #666;">Your Check-In Code:</p>
                <div class="code-box">
                    <span class="code-text">${checkInCode}</span>
                </div>
                <p style="color: #666; font-size: 14px; margin: 10px 0 0 0;">
                    Tell this code to staff when checking in for class
                </p>
            </div>
            
            <p>We're excited to see you on the dance floor! 💃🕺</p>
            
            <p><em>The Estilo Latino Team</em></p>
        </div>
        <div class="footer">
            <p>${STUDIO_NAME}<br>
            📧 ${STUDIO_EMAIL}</p>
        </div>
    </div>
</body>
</html>`;

        const subject = `✅ Purchase Confirmed - ${cardName} (${totalClasses} classes)`;
        const success = await sendEmail(userEmail, subject, html);

        if (success) {
            console.log(`✅ Purchase confirmation sent to ${userEmail} for ${cardName}`);
        }
        return success;
    } catch (error) {
        console.error('❌ Error sending purchase confirmation:', error);
        return false;
    }
}

// ============================================
// PASSWORD RESET EMAIL
// ============================================

export async function sendPasswordResetEmail(
    email: string,
    firstName: string,
    resetToken: string
): Promise<boolean> {
    try {
        // In production, this would be your actual domain
        const resetUrl = process.env.FRONTEND_URL
            ? `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`
            : `http://localhost:5173/reset-password?token=${resetToken}`;

        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ffc700, #e6b400); padding: 30px; text-align: center; }
        .header h1 { color: #000; margin: 0; }
        .content { padding: 30px; background: #f9f9f9; }
        .reset-box { background: #fff; border: 2px solid #ffc700; padding: 25px; border-radius: 12px; margin: 20px 0; text-align: center; }
        .button { display: inline-block; padding: 15px 40px; background: #ffc700; color: #000; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; }
        .button:hover { background: #e6b400; }
        .note { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 Password Reset Request</h1>
        </div>
        <div class="content">
            <p>Hi <strong>${firstName}</strong>,</p>
            
            <p>We received a request to reset your password for your Estilo Latino Dance Studio account.</p>
            
            <div class="reset-box">
                <p>Click the button below to reset your password:</p>
                <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            
            <div class="note">
                <p style="margin: 0;"><strong>⏰ This link expires in 1 hour.</strong></p>
            </div>
            
            <p>If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.</p>
            
            <p><em>The Estilo Latino Team</em></p>
        </div>
        <div class="footer">
            <p>${STUDIO_NAME}<br>
            📧 ${STUDIO_EMAIL}</p>
            <p style="color: #999; font-size: 10px;">If the button doesn't work, copy and paste this link into your browser:<br>${resetUrl}</p>
        </div>
    </div>
</body>
</html>`;

        const subject = '🔐 Reset Your Password - Estilo Latino';
        const success = await sendEmail(email, subject, html);

        if (success) {
            console.log(`✅ Password reset email sent to ${email}`);
        }
        return success;
    } catch (error) {
        console.error('❌ Error sending password reset email:', error);
        return false;
    }
}
