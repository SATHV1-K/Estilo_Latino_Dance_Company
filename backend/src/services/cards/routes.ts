import { Router, Request, Response } from 'express';
import { asyncHandler, createError } from '../../middleware';
import { authenticate, requireAdmin, requireStaffOrAdmin, requireSelfOrAdmin } from '../../middleware/auth';
import { validateRequest, adminCreateCardSchema, paginationSchema } from '../../shared/validation';
import * as cardService from './cardService';
import * as userService from '../users/userService';

const router = Router();

/**
 * GET /api/cards/types
 * Get all available card types (public)
 */
router.get(
    '/types',
    asyncHandler(async (req: Request, res: Response) => {
        const cardTypes = await cardService.getCardTypes();

        res.json({
            success: true,
            data: cardTypes,
        });
    })
);

/**
 * GET /api/cards/user/:userId
 * Get all cards for a user
 */
router.get(
    '/user/:userId',
    authenticate,
    requireSelfOrAdmin('userId'),
    asyncHandler(async (req: Request, res: Response) => {
        const cards = await cardService.getUserCards(req.params.userId);

        res.json({
            success: true,
            data: cards,
        });
    })
);

/**
 * GET /api/cards/family-member/:memberId
 * Get all cards for a family member
 */
router.get(
    '/family-member/:memberId',
    authenticate,
    asyncHandler(async (req: Request, res: Response) => {
        // Check ownership if not admin
        if (req.user!.role !== 'admin' && req.user!.role !== 'staff') {
            const isOwner = await userService.isFamilyMemberOwner(
                req.params.memberId,
                req.user!.userId
            );
            if (!isOwner) {
                throw createError('Access denied', 403);
            }
        }

        const cards = await cardService.getFamilyMemberCards(req.params.memberId);

        res.json({
            success: true,
            data: cards,
        });
    })
);

/**
 * GET /api/cards/my-active
 * Get active card for the currently logged-in user
 */
router.get(
    '/my-active',
    authenticate,
    asyncHandler(async (req: Request, res: Response) => {
        const card = await cardService.getActiveCard(req.user!.userId, undefined);

        res.json({
            success: true,
            data: card,
        });
    })
);

/**
 * GET /api/cards/active/:userId
 * Get active card for a user (staff/admin - for check-in)
 */
router.get(
    '/active/user/:userId',
    authenticate,
    requireStaffOrAdmin,
    asyncHandler(async (req: Request, res: Response) => {
        const card = await cardService.getActiveCard(req.params.userId, undefined);

        res.json({
            success: true,
            data: card,
        });
    })
);

/**
 * GET /api/cards/active/family-member/:memberId
 * Get active card for a family member (staff/admin - for check-in)
 */
router.get(
    '/active/family-member/:memberId',
    authenticate,
    requireStaffOrAdmin,
    asyncHandler(async (req: Request, res: Response) => {
        const card = await cardService.getActiveCard(undefined, req.params.memberId);

        res.json({
            success: true,
            data: card,
        });
    })
);

/**
 * GET /api/cards/expired
 * Get all expired cards (admin only)
 */
router.get(
    '/expired',
    authenticate,
    requireAdmin,
    asyncHandler(async (req: Request, res: Response) => {
        const { page = 1, limit = 20 } = req.query;
        const validation = validateRequest(paginationSchema, { page, limit });

        const result = await cardService.getExpiredCards(
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
 * POST /api/cards/admin-create
 * Admin creates a pass (for cash payments)
 */
router.post(
    '/admin-create',
    authenticate,
    requireAdmin,
    asyncHandler(async (req: Request, res: Response) => {
        const validation = validateRequest(adminCreateCardSchema, req.body);
        if (!validation.success) {
            throw createError('Validation failed', 400, validation.errors);
        }

        const { user_id, family_member_id, classes, expiration_date, amount_paid } = validation.data!;

        const card = await cardService.adminCreatePass({
            user_id,
            family_member_id,
            classes,
            expiration_date,
            amount_paid,
            admin_id: req.user!.userId,
        });

        res.status(201).json({
            success: true,
            data: card,
            message: 'Pass created successfully',
        });
    })
);

/**
 * GET /api/cards/expiring-soon
 * Get cards expiring within 7 days (admin only)
 */
router.get(
    '/expiring-soon',
    authenticate,
    requireAdmin,
    asyncHandler(async (req: Request, res: Response) => {
        const days = parseInt(req.query.days as string) || 7;
        const cards = await cardService.getCardsExpiringSoon(days);

        res.json({
            success: true,
            data: cards,
        });
    })
);

/**
 * GET /api/cards/low-balance
 * Get cards with 2 or fewer classes (admin only)
 */
router.get(
    '/low-balance',
    authenticate,
    requireAdmin,
    asyncHandler(async (req: Request, res: Response) => {
        const cards = await cardService.getLowBalanceCards();

        res.json({
            success: true,
            data: cards,
        });
    })
);

/**
 * GET /api/cards/all
 * Get all cards with user info (admin only - for dashboard)
 */
router.get(
    '/all',
    authenticate,
    requireAdmin,
    asyncHandler(async (req: Request, res: Response) => {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const status = req.query.status as 'active' | 'expired' | 'exhausted' | undefined;

        const result = await cardService.getAllCards(page, limit, status);

        res.json({
            success: true,
            ...result,
        });
    })
);

/**
 * GET /api/cards/revenue-stats
 * Get revenue statistics (admin only)
 */
router.get(
    '/revenue-stats',
    authenticate,
    requireAdmin,
    asyncHandler(async (req: Request, res: Response) => {
        const stats = await cardService.getRevenueStats();

        res.json({
            success: true,
            data: stats,
        });
    })
);

export default router;
