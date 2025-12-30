import { Router, Request, Response } from 'express';
import { asyncHandler, createError } from '../../middleware';
import { authenticate, requireAdmin, requireStaffOrAdmin, requireSelfOrAdmin } from '../../middleware/auth';
import { validateRequest, updateUserSchema, createFamilyMemberSchema, paginationSchema, searchUserSchema } from '../../shared/validation';
import * as userService from './userService';

const router = Router();

/**
 * GET /api/users
 * Get all customers (admin only)
 */
router.get(
    '/',
    authenticate,
    requireAdmin,
    asyncHandler(async (req: Request, res: Response) => {
        const { page = 1, limit = 20 } = req.query;
        const validation = validateRequest(paginationSchema, { page, limit });

        const result = await userService.getAllCustomers(
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
 * GET /api/users/search
 * Search users by name, email, or phone (staff/admin)
 */
router.get(
    '/search',
    authenticate,
    requireStaffOrAdmin,
    asyncHandler(async (req: Request, res: Response) => {
        const { query } = req.query;

        if (!query || typeof query !== 'string') {
            throw createError('Search query is required', 400);
        }

        const results = await userService.searchByIdentifier(query);

        res.json({
            success: true,
            data: results,
        });
    })
);

/**
 * GET /api/users/qr/:qrCode
 * Find user or family member by QR code (staff/admin)
 */
router.get(
    '/qr/:qrCode',
    authenticate,
    requireStaffOrAdmin,
    asyncHandler(async (req: Request, res: Response) => {
        const { qrCode } = req.params;

        // Try to find user first
        const user = await userService.getUserByQRCode(qrCode);
        if (user) {
            res.json({
                success: true,
                data: {
                    type: 'user',
                    entity: user,
                },
            });
            return;
        }

        // Try to find family member
        const member = await userService.getFamilyMemberByQRCode(qrCode);
        if (member) {
            res.json({
                success: true,
                data: {
                    type: 'family_member',
                    entity: member,
                },
            });
            return;
        }

        throw createError('No user found with this QR code', 404);
    })
);

/**
 * GET /api/users/:userId
 * Get user by ID
 */
router.get(
    '/:userId',
    authenticate,
    requireSelfOrAdmin('userId'),
    asyncHandler(async (req: Request, res: Response) => {
        const user = await userService.getUserById(req.params.userId);

        if (!user) {
            throw createError('User not found', 404);
        }

        res.json({
            success: true,
            data: user,
        });
    })
);

/**
 * PUT /api/users/:userId
 * Update user profile
 */
router.put(
    '/:userId',
    authenticate,
    requireSelfOrAdmin('userId'),
    asyncHandler(async (req: Request, res: Response) => {
        const validation = validateRequest(updateUserSchema, req.body);
        if (!validation.success) {
            throw createError('Validation failed', 400, validation.errors);
        }

        const user = await userService.updateUser(req.params.userId, validation.data!);

        res.json({
            success: true,
            data: user,
        });
    })
);

/**
 * DELETE /api/users/:userId
 * Delete user (admin only)
 */
router.delete(
    '/:userId',
    authenticate,
    requireAdmin,
    asyncHandler(async (req: Request, res: Response) => {
        const success = await userService.deleteUser(req.params.userId);

        if (!success) {
            throw createError('Failed to delete user', 500);
        }

        res.json({
            success: true,
            message: 'User deleted successfully',
        });
    })
);

// ============================================
// FAMILY MEMBER ROUTES
// ============================================

/**
 * GET /api/users/:userId/family-members
 * Get all family members for a user
 */
router.get(
    '/:userId/family-members',
    authenticate,
    requireSelfOrAdmin('userId'),
    asyncHandler(async (req: Request, res: Response) => {
        const members = await userService.getFamilyMembers(req.params.userId);

        res.json({
            success: true,
            data: members,
        });
    })
);

/**
 * POST /api/users/:userId/family-members
 * Add a family member
 */
router.post(
    '/:userId/family-members',
    authenticate,
    requireSelfOrAdmin('userId'),
    asyncHandler(async (req: Request, res: Response) => {
        const validation = validateRequest(createFamilyMemberSchema, req.body);
        if (!validation.success) {
            throw createError('Validation failed', 400, validation.errors);
        }

        const member = await userService.addFamilyMember(
            req.params.userId,
            validation.data!
        );

        res.status(201).json({
            success: true,
            data: member,
            message: 'Family member added successfully',
        });
    })
);

/**
 * GET /api/users/family-members/:memberId
 * Get a specific family member
 */
router.get(
    '/family-members/:memberId',
    authenticate,
    asyncHandler(async (req: Request, res: Response) => {
        const member = await userService.getFamilyMemberById(req.params.memberId);

        if (!member) {
            throw createError('Family member not found', 404);
        }

        // Check ownership if not admin
        if (req.user!.role !== 'admin') {
            const isOwner = await userService.isFamilyMemberOwner(
                req.params.memberId,
                req.user!.userId
            );
            if (!isOwner) {
                throw createError('Access denied', 403);
            }
        }

        res.json({
            success: true,
            data: member,
        });
    })
);

/**
 * PUT /api/users/family-members/:memberId
 * Update a family member
 */
router.put(
    '/family-members/:memberId',
    authenticate,
    asyncHandler(async (req: Request, res: Response) => {
        // Check ownership if not admin
        if (req.user!.role !== 'admin') {
            const isOwner = await userService.isFamilyMemberOwner(
                req.params.memberId,
                req.user!.userId
            );
            if (!isOwner) {
                throw createError('Access denied', 403);
            }
        }

        const validation = validateRequest(createFamilyMemberSchema, req.body);
        if (!validation.success) {
            throw createError('Validation failed', 400, validation.errors);
        }

        const member = await userService.updateFamilyMember(
            req.params.memberId,
            validation.data!
        );

        res.json({
            success: true,
            data: member,
        });
    })
);

/**
 * DELETE /api/users/family-members/:memberId
 * Delete a family member
 */
router.delete(
    '/family-members/:memberId',
    authenticate,
    asyncHandler(async (req: Request, res: Response) => {
        // Check ownership if not admin
        if (req.user!.role !== 'admin') {
            const isOwner = await userService.isFamilyMemberOwner(
                req.params.memberId,
                req.user!.userId
            );
            if (!isOwner) {
                throw createError('Access denied', 403);
            }
        }

        const success = await userService.deleteFamilyMember(req.params.memberId);

        if (!success) {
            throw createError('Failed to delete family member', 500);
        }

        res.json({
            success: true,
            message: 'Family member deleted successfully',
        });
    })
);

export default router;
