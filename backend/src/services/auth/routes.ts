import { Router, Request, Response } from 'express';
import { asyncHandler, createError } from '../../middleware';
import { authenticate } from '../../middleware/auth';
import { validateRequest, loginSchema, signupSchema, forgotPasswordSchema, resetPasswordSchema } from '../../shared/validation';
import * as authService from './authService';
import { sendPasswordResetEmail } from '../notifications/notificationService';

const router = Router();

/**
 * POST /api/auth/register
 * Register a new customer account
 */
router.post(
    '/register',
    asyncHandler(async (req: Request, res: Response) => {
        const validation = validateRequest(signupSchema, req.body);
        if (!validation.success) {
            throw createError('Validation failed', 400, validation.errors);
        }

        const result = await authService.registerUser(validation.data!);

        // Set refresh token as HTTP-only cookie
        res.cookie('refreshToken', result.tokens.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        res.status(201).json({
            success: true,
            data: {
                user: result.user,
                accessToken: result.tokens.accessToken,
            },
            message: 'Account created successfully',
        });
    })
);

/**
 * POST /api/auth/login
 * Authenticate user and return tokens
 */
router.post(
    '/login',
    asyncHandler(async (req: Request, res: Response) => {
        const validation = validateRequest(loginSchema, req.body);
        if (!validation.success) {
            throw createError('Validation failed', 400, validation.errors);
        }

        const { email, password, loginType } = validation.data!;
        const result = await authService.loginUser(email, password, loginType);

        // Set refresh token as HTTP-only cookie
        res.cookie('refreshToken', result.tokens.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        res.json({
            success: true,
            data: {
                user: result.user,
                accessToken: result.tokens.accessToken,
            },
        });
    })
);

/**
 * POST /api/auth/logout
 * Clear refresh token cookie
 */
router.post(
    '/logout',
    asyncHandler(async (req: Request, res: Response) => {
        res.clearCookie('refreshToken');
        res.json({
            success: true,
            message: 'Logged out successfully',
        });
    })
);

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token from cookie
 */
router.post(
    '/refresh',
    asyncHandler(async (req: Request, res: Response) => {
        const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

        if (!refreshToken) {
            throw createError('Refresh token required', 401);
        }

        const result = await authService.refreshAccessToken(refreshToken);

        // Set new refresh token
        res.cookie('refreshToken', result.tokens.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.json({
            success: true,
            data: {
                user: result.user,
                accessToken: result.tokens.accessToken,
            },
        });
    })
);

/**
 * POST /api/auth/forgot-password
 * Request password reset email
 */
router.post(
    '/forgot-password',
    asyncHandler(async (req: Request, res: Response) => {
        const validation = validateRequest(forgotPasswordSchema, req.body);
        if (!validation.success) {
            throw createError('Validation failed', 400, validation.errors);
        }

        const result = await authService.requestPasswordReset(validation.data!.email);

        // Send password reset email if user found
        if (result.token && result.user) {
            console.log(`📧 Sending password reset email to ${result.user.email}`);
            await sendPasswordResetEmail(
                result.user.email,
                result.user.first_name || 'Customer',
                result.token
            );
        }

        // Always return success (don't reveal if email exists)
        res.json({
            success: true,
            message: 'If an account exists with that email, a reset link has been sent',
        });
    })
);

/**
 * POST /api/auth/reset-password
 * Reset password using token
 */
router.post(
    '/reset-password',
    asyncHandler(async (req: Request, res: Response) => {
        const validation = validateRequest(resetPasswordSchema, req.body);
        if (!validation.success) {
            throw createError('Validation failed', 400, validation.errors);
        }

        await authService.resetPassword(
            validation.data!.token,
            validation.data!.password
        );

        res.json({
            success: true,
            message: 'Password reset successfully',
        });
    })
);

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get(
    '/me',
    authenticate,
    asyncHandler(async (req: Request, res: Response) => {
        const user = await authService.getUserById(req.user!.userId);

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
 * POST /api/auth/change-password
 * Change password for logged in user
 */
router.post(
    '/change-password',
    authenticate,
    asyncHandler(async (req: Request, res: Response) => {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            throw createError('Current password and new password are required', 400);
        }

        await authService.changePassword(
            req.user!.userId,
            currentPassword,
            newPassword
        );

        res.json({
            success: true,
            message: 'Password changed successfully',
        });
    })
);

/**
 * PUT /api/auth/profile
 * Update user profile (phone and address)
 */
router.put(
    '/profile',
    authenticate,
    asyncHandler(async (req: Request, res: Response) => {
        const { phone, address, city, state, zipCode } = req.body;

        const result = await authService.updateProfile(req.user!.userId, {
            phone,
            address,
            city,
            state,
            zip_code: zipCode,
        });

        res.json({
            success: true,
            data: { user: result.user },
            message: 'Profile updated successfully',
        });
    })
);

export default router;

