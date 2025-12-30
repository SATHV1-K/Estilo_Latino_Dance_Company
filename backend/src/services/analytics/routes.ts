import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../middleware';
import { authenticate, requireAdmin } from '../../middleware/auth';
import * as analyticsService from './analyticsService';

const router = Router();

/**
 * GET /api/analytics/dashboard
 * Get dashboard stats (admin only)
 */
router.get(
    '/dashboard',
    authenticate,
    requireAdmin,
    asyncHandler(async (req: Request, res: Response) => {
        const stats = await analyticsService.getDashboardStats();

        res.json({
            success: true,
            data: stats,
        });
    })
);

/**
 * GET /api/analytics/revenue
 * Get revenue breakdown by card type (admin only)
 */
router.get(
    '/revenue',
    authenticate,
    requireAdmin,
    asyncHandler(async (req: Request, res: Response) => {
        const revenue = await analyticsService.getRevenueByCardType();

        res.json({
            success: true,
            data: revenue,
        });
    })
);

/**
 * GET /api/analytics/attendance
 * Get attendance trends (admin only)
 */
router.get(
    '/attendance',
    authenticate,
    requireAdmin,
    asyncHandler(async (req: Request, res: Response) => {
        const days = parseInt(req.query.days as string) || 30;
        const trends = await analyticsService.getAttendanceTrends(days);

        res.json({
            success: true,
            data: trends,
        });
    })
);

/**
 * GET /api/analytics/monthly
 * Get monthly analytics (admin only)
 */
router.get(
    '/monthly',
    authenticate,
    requireAdmin,
    asyncHandler(async (req: Request, res: Response) => {
        const months = parseInt(req.query.months as string) || 6;
        const analytics = await analyticsService.getMonthlyAnalytics(months);

        res.json({
            success: true,
            data: analytics,
        });
    })
);

export default router;
