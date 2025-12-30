// Notification API Routes
import { Router, Request, Response } from 'express';
import { asyncHandler, createError } from '../../middleware';
import { authenticate, requireAdmin } from '../../middleware/auth';
import { runNotificationsNow } from './scheduler';
import {
    sendLowBalanceAlert,
    sendExpirationReminder,
    sendBirthdayNotification
} from './notificationService';
import { Resend } from 'resend';

const router = Router();

/**
 * POST /api/notifications/run
 * Manually trigger daily notifications (admin only)
 */
router.post(
    '/run',
    authenticate,
    requireAdmin,
    asyncHandler(async (req: Request, res: Response) => {
        const results = await runNotificationsNow();

        res.json({
            success: true,
            message: 'Notifications processed',
            data: results
        });
    })
);

/**
 * GET /api/notifications/cron
 * Webhook endpoint for external cron services (e.g., cron-job.org)
 * Uses a secret token instead of user authentication
 * 
 * To set up:
 * 1. Set CRON_SECRET in Railway environment variables
 * 2. Create a cron job at cron-job.org to call:
 *    GET https://your-backend.up.railway.app/api/notifications/cron?token=YOUR_SECRET
 *    Schedule: Daily at 9:00 AM
 */
router.get(
    '/cron',
    asyncHandler(async (req: Request, res: Response) => {
        const token = req.query.token as string;
        const expectedToken = process.env.CRON_SECRET;

        // Validate token
        if (!expectedToken) {
            console.warn('⚠️ CRON_SECRET not set - cron endpoint is disabled');
            throw createError('Cron endpoint not configured', 503);
        }

        if (!token || token !== expectedToken) {
            console.warn('⚠️ Invalid cron token attempt');
            throw createError('Invalid token', 401);
        }

        console.log('⏰ External cron triggered daily notifications...');
        const startTime = Date.now();

        const results = await runNotificationsNow();
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log(`✅ Cron notifications completed in ${duration}s:`, {
            lowBalance: results.lowBalanceCount,
            expiring: results.expiringCount,
            expired: results.expiredCount,
            birthdays: results.birthdayCount
        });

        res.json({
            success: true,
            message: 'Daily notifications processed via cron',
            duration: `${duration}s`,
            results: {
                lowBalanceAlerts: results.lowBalanceCount,
                expiringReminders: results.expiringCount,
                expiredNotices: results.expiredCount,
                birthdayEmails: results.birthdayCount
            }
        });
    })
);

/**
 * POST /api/notifications/test-email
 * Send a test email to verify SMTP configuration
 */
router.post(
    '/test-email',
    authenticate,
    requireAdmin,
    asyncHandler(async (req: Request, res: Response) => {
        const { email } = req.body;

        if (!email) {
            throw createError('Email address is required', 400);
        }

        if (!process.env.RESEND_API_KEY) {
            throw createError('RESEND_API_KEY is not configured', 500);
        }

        const resend = new Resend(process.env.RESEND_API_KEY);
        const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';

        try {
            const { data, error } = await resend.emails.send({
                from: `Estilo Latino Test <${fromEmail}>`,
                to: [email],
                subject: '✅ Test Email from Estilo Latino',
                html: `
                    <div style="font-family: Arial, sans-serif; padding: 20px;">
                        <h2 style="color: #ffc700;">🎉 Email Configuration Working!</h2>
                        <p>This is a test email from the Estilo Latino notification system.</p>
                        <p>If you're receiving this, your Resend configuration is correct.</p>
                        <hr>
                        <p style="color: #666; font-size: 12px;">
                            Provider: Resend<br>
                            From: ${fromEmail}<br>
                            Time: ${new Date().toISOString()}
                        </p>
                    </div>
                `
            });

            if (error) {
                throw createError(`Email test failed: ${error.message}`, 500);
            }

            res.json({
                success: true,
                message: `Test email sent to ${email}`,
                emailId: data?.id,
                config: {
                    provider: 'Resend',
                    fromEmail
                }
            });
        } catch (error: any) {
            throw createError(`Email test failed: ${error.message}`, 500);
        }
    })
);

/**
 * POST /api/notifications/send-low-balance
 * Manually send low balance alert (admin only)
 */
router.post(
    '/send-low-balance',
    authenticate,
    requireAdmin,
    asyncHandler(async (req: Request, res: Response) => {
        const { userId, userName, userEmail, classesRemaining, cardName } = req.body;

        if (!userEmail || !userName || classesRemaining === undefined) {
            throw createError('Missing required fields: userEmail, userName, classesRemaining', 400);
        }

        const success = await sendLowBalanceAlert(
            userId || 'manual',
            userName,
            userEmail,
            classesRemaining,
            cardName || 'Punch Card'
        );

        res.json({
            success,
            message: success ? 'Low balance alert sent' : 'Failed to send alert'
        });
    })
);

/**
 * POST /api/notifications/send-birthday
 * Manually send birthday notification (admin only)
 */
router.post(
    '/send-birthday',
    authenticate,
    requireAdmin,
    asyncHandler(async (req: Request, res: Response) => {
        const { userId, userName, userEmail } = req.body;

        if (!userEmail || !userName) {
            throw createError('Missing required fields: userEmail, userName', 400);
        }

        const success = await sendBirthdayNotification(userId || 'manual', userName, userEmail);

        res.json({
            success,
            message: success ? 'Birthday notification sent' : 'Failed to send notification'
        });
    })
);

/**
 * GET /api/notifications/config
 * Get current notification configuration (admin only)
 */
router.get(
    '/config',
    authenticate,
    requireAdmin,
    asyncHandler(async (req: Request, res: Response) => {
        res.json({
            success: true,
            data: {
                smtp: {
                    host: process.env.SMTP_HOST,
                    port: process.env.SMTP_PORT,
                    secure: process.env.SMTP_SECURE,
                    user: process.env.SMTP_USER,
                    fromEmail: process.env.FROM_EMAIL,
                    studioEmail: process.env.STUDIO_EMAIL
                },
                scheduler: {
                    timezone: process.env.STUDIO_TIMEZONE || 'America/New_York',
                    schedule: '9:00 AM daily'
                },
                alerts: {
                    lowBalanceThreshold: 2,
                    expirationReminderDays: [3, 1]
                }
            }
        });
    })
);

export default router;
