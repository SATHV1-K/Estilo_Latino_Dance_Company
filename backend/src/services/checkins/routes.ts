import { Router, Request, Response } from 'express';
import { asyncHandler, createError } from '../../middleware';
import { authenticate, requireStaffOrAdmin, requireSelfOrAdmin } from '../../middleware/auth';
import { validateRequest, checkInSchema, paginationSchema, dateRangeSchema } from '../../shared/validation';
import * as checkInService from './checkInService';

const router = Router();

/**
 * POST /api/checkins
 * Check in a customer (staff/admin only)
 */
router.post(
    '/',
    authenticate,
    requireStaffOrAdmin,
    asyncHandler(async (req: Request, res: Response) => {
        const validation = validateRequest(checkInSchema, req.body);
        if (!validation.success) {
            throw createError('Validation failed', 400, validation.errors);
        }

        const checkIn = await checkInService.checkIn({
            ...validation.data!,
            punched_by_user_id: req.user!.userId,
        });

        res.status(201).json({
            success: true,
            data: checkIn,
            message: checkIn.is_birthday_checkin
                ? '🎂 Happy Birthday check-in complete!'
                : 'Check-in successful',
        });
    })
);

/**
 * GET /api/checkins/today
 * Get today's check-ins (staff/admin)
 */
router.get(
    '/today',
    authenticate,
    requireStaffOrAdmin,
    asyncHandler(async (req: Request, res: Response) => {
        const checkIns = await checkInService.getTodayCheckIns();

        res.json({
            success: true,
            data: checkIns,
            count: checkIns.length,
        });
    })
);

/**
 * GET /api/checkins/history
 * Get check-in history with pagination (staff/admin)
 */
router.get(
    '/history',
    authenticate,
    requireStaffOrAdmin,
    asyncHandler(async (req: Request, res: Response) => {
        const { page = 1, limit = 20, start_date, end_date } = req.query;

        const paginationValidation = validateRequest(paginationSchema, { page, limit });
        const dateValidation = validateRequest(dateRangeSchema, { start_date, end_date });

        const result = await checkInService.getCheckInHistory(
            paginationValidation.data?.page || 1,
            paginationValidation.data?.limit || 20,
            dateValidation.data?.start_date,
            dateValidation.data?.end_date
        );

        res.json({
            success: true,
            ...result,
        });
    })
);

/**
 * GET /api/checkins/user/:userId
 * Get check-in history for a specific user
 */
router.get(
    '/user/:userId',
    authenticate,
    requireSelfOrAdmin('userId'),
    asyncHandler(async (req: Request, res: Response) => {
        const { page = 1, limit = 20 } = req.query;
        const validation = validateRequest(paginationSchema, { page, limit });

        const result = await checkInService.getUserCheckInHistory(
            req.params.userId,
            validation.data?.page || 1,
            validation.data?.limit || 20
        );

        res.json({
            success: true,
            ...result,
        });
    })
);

/**
 * GET /api/checkins/birthday-pass/:userId
 * Check if user has a valid birthday pass today
 */
router.get(
    '/birthday-pass/user/:userId',
    authenticate,
    requireStaffOrAdmin,
    asyncHandler(async (req: Request, res: Response) => {
        const pass = await checkInService.getValidBirthdayPass(req.params.userId, undefined);

        res.json({
            success: true,
            data: pass,
            hasBirthdayPass: !!pass,
        });
    })
);

/**
 * GET /api/checkins/birthday-pass/family-member/:memberId
 * Check if family member has a valid birthday pass today
 */
router.get(
    '/birthday-pass/family-member/:memberId',
    authenticate,
    requireStaffOrAdmin,
    asyncHandler(async (req: Request, res: Response) => {
        const pass = await checkInService.getValidBirthdayPass(undefined, req.params.memberId);

        res.json({
            success: true,
            data: pass,
            hasBirthdayPass: !!pass,
        });
    })
);

/**
 * GET /api/checkins/count/today
 * Get count of today's check-ins (for dashboard)
 */
router.get(
    '/count/today',
    authenticate,
    requireStaffOrAdmin,
    asyncHandler(async (req: Request, res: Response) => {
        const count = await checkInService.getTodayCheckInCount();

        res.json({
            success: true,
            data: { count },
        });
    })
);

/**
 * GET /api/checkins/status/user/:userId
 * Get check-in status for a user (birthday today, already checked in)
 */
router.get(
    '/status/user/:userId',
    authenticate,
    requireStaffOrAdmin,
    asyncHandler(async (req: Request, res: Response) => {
        const userId = req.params.userId;

        const [isBirthday, hasCheckedIn] = await Promise.all([
            checkInService.isBirthdayToday(userId, undefined),
            checkInService.hasCheckedInToday(userId, undefined),
        ]);

        res.json({
            success: true,
            data: {
                isBirthdayToday: isBirthday,
                hasCheckedInToday: hasCheckedIn,
            },
        });
    })
);

/**
 * GET /api/checkins/status/family-member/:memberId
 * Get check-in status for a family member (birthday today, already checked in)
 */
router.get(
    '/status/family-member/:memberId',
    authenticate,
    requireStaffOrAdmin,
    asyncHandler(async (req: Request, res: Response) => {
        const memberId = req.params.memberId;

        const [isBirthday, hasCheckedIn] = await Promise.all([
            checkInService.isBirthdayToday(undefined, memberId),
            checkInService.hasCheckedInToday(undefined, memberId),
        ]);

        res.json({
            success: true,
            data: {
                isBirthdayToday: isBirthday,
                hasCheckedInToday: hasCheckedIn,
            },
        });
    })
);

export default router;

