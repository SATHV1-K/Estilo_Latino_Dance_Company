import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireStaffOrAdmin } from '../../middleware/auth';
import * as birthdayService from './birthdayService';

const router = Router();

// Helper for async handlers
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
    (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };

/**
 * GET /api/birthday/todays-birthdays
 * Get all users/family members with birthdays today (staff only)
 */
router.get('/todays-birthdays', authenticate, requireStaffOrAdmin, asyncHandler(async (req, res) => {
    const birthdays = await birthdayService.getTodaysBirthdays();

    res.json({
        success: true,
        data: birthdays,
        count: birthdays.length,
    });
}));

/**
 * GET /api/birthday/check/:userId
 * Check if a user has a valid birthday pass today
 */
router.get('/check/user/:userId', authenticate, requireStaffOrAdmin, asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const isBirthday = await birthdayService.isBirthday(userId, undefined);
    const pass = await birthdayService.checkBirthdayPass(userId, undefined);

    res.json({
        success: true,
        data: {
            isBirthday,
            hasValidPass: !!pass,
            pass,
        },
    });
}));

/**
 * GET /api/birthday/check/family/:familyMemberId
 * Check if a family member has a valid birthday pass today
 */
router.get('/check/family/:familyMemberId', authenticate, requireStaffOrAdmin, asyncHandler(async (req, res) => {
    const { familyMemberId } = req.params;

    const isBirthday = await birthdayService.isBirthday(undefined, familyMemberId);
    const pass = await birthdayService.checkBirthdayPass(undefined, familyMemberId);

    res.json({
        success: true,
        data: {
            isBirthday,
            hasValidPass: !!pass,
            pass,
        },
    });
}));

/**
 * POST /api/birthday/create-pass
 * Create a birthday pass for a user (staff creates for customer)
 */
router.post('/create-pass', authenticate, requireStaffOrAdmin, asyncHandler(async (req, res) => {
    const { userId, familyMemberId } = req.body;

    if (!userId && !familyMemberId) {
        return res.status(400).json({
            success: false,
            error: 'Either userId or familyMemberId is required',
        });
    }

    // Check if it's actually their birthday
    const isBirthday = await birthdayService.isBirthday(userId, familyMemberId);

    if (!isBirthday) {
        return res.status(400).json({
            success: false,
            error: 'Birthday pass can only be created on the person\'s birthday',
        });
    }

    const pass = await birthdayService.createBirthdayPass(userId, familyMemberId);

    res.json({
        success: true,
        data: pass,
        message: '🎂 Birthday pass created! Valid for today only.',
    });
}));

/**
 * POST /api/birthday/use-pass
 * Use a birthday pass during check-in
 */
router.post('/use-pass', authenticate, requireStaffOrAdmin, asyncHandler(async (req, res) => {
    const { passId, checkInId } = req.body;

    if (!passId || !checkInId) {
        return res.status(400).json({
            success: false,
            error: 'passId and checkInId are required',
        });
    }

    const pass = await birthdayService.useBirthdayPass(passId, checkInId);

    res.json({
        success: true,
        data: pass,
        message: '🎉 Birthday pass used successfully!',
    });
}));

/**
 * GET /api/birthday/history
 * Get birthday pass usage history (admin only)
 */
router.get('/history', authenticate, requireStaffOrAdmin, asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await birthdayService.getBirthdayPassHistory(page, limit);

    res.json({
        success: true,
        ...result,
    });
}));

export default router;
