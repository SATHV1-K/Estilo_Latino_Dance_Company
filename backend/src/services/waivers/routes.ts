import { Router, Request, Response, NextFunction } from 'express';
import * as waiverService from './waiverService';
import { sendWaiverEmails, verifySmtpConnection } from './emailService';
import { generateWaiverPDF, WaiverFormData } from './pdfGenerator';
import { authenticate, requireRole } from '../../middleware/auth';
import * as authService from '../auth/authService';

const router = Router();

/**
 * GET /api/waivers/test-email
 * Test SMTP connection (for debugging)
 */
router.get('/test-email', async (req: Request, res: Response) => {
    const result = await verifySmtpConnection();
    res.json({
        success: result.success,
        message: result.success ? 'SMTP connection successful' : 'SMTP connection failed',
        error: result.error
    });
});


/**
 * POST /api/waivers/signup
 * Complete signup flow: create account + submit waiver + send emails
 * This is the main endpoint for new user registration with waiver
 */
router.post('/signup', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {
            email,
            password,
            firstName,
            lastName,
            phone,
            formData
        }: {
            email: string;
            password: string;
            firstName: string;
            lastName: string;
            phone: string;
            formData: WaiverFormData;
        } = req.body;

        // Validate required fields
        if (!email || !password || !firstName || !lastName || !formData) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }

        // 1. Register user account
        console.log('📝 Creating user account for:', email);
        const authResult = await authService.registerUser({
            email,
            password,
            first_name: firstName,
            last_name: lastName,
            phone: phone || formData.phone,
            birthday: formData.birthday || undefined
        });

        const user = authResult.user;
        console.log('✅ User account created:', user.id);

        // 2. Generate waiver PDF
        console.log('📄 Generating waiver PDF...');
        const pdfBuffer = await generateWaiverPDF(formData);
        console.log('✅ PDF generated, size:', pdfBuffer.length, 'bytes');

        // 3. Create waiver record (uploads PDF to storage)
        console.log('💾 Creating waiver record...');
        const waiver = await waiverService.createWaiver(user.id, formData);
        console.log('✅ Waiver created:', waiver.id);

        // 4. Send emails (customer welcome + studio notification)
        console.log('📧 Sending emails...');
        const emailResult = await sendWaiverEmails(formData, pdfBuffer);
        console.log('✅ Emails sent:', emailResult);

        // 5. Update waiver record with email status
        if (emailResult.customerEmailSent) {
            await waiverService.markWaiverEmailSent(waiver.id);
        }

        res.status(201).json({
            success: true,
            data: {
                user: {
                    id: authResult.user.id,
                    email: authResult.user.email,
                    firstName: authResult.user.first_name,
                    lastName: authResult.user.last_name,
                    phone: authResult.user.phone,
                    role: authResult.user.role,
                    createdAt: authResult.user.created_at,
                    qrCode: authResult.user.qr_code,
                    checkInCode: authResult.user.check_in_code,
                    birthday: authResult.user.birthday
                },
                accessToken: authResult.tokens.accessToken,
                waiver: {
                    id: waiver.id,
                    pdfPath: waiver.pdf_storage_path,
                    signedAt: waiver.signed_at,
                    emailSent: emailResult.customerEmailSent
                }
            },
            message: 'Account created and waiver submitted successfully'
        });
    } catch (error) {
        console.error('Error in signup with waiver:', error);
        next(error);
    }
});

/**
 * POST /api/waivers
 * Submit waiver for existing user
 */
router.post('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user?.id;
        const { formData, familyMemberId }: { formData: WaiverFormData; familyMemberId?: string } = req.body;

        if (!formData) {
            return res.status(400).json({
                success: false,
                error: 'Missing waiver form data'
            });
        }

        // Generate PDF
        const pdfBuffer = await generateWaiverPDF(formData);

        // Create waiver record
        const waiver = await waiverService.createWaiver(userId, formData, familyMemberId);

        // Send emails
        const emailResult = await sendWaiverEmails(formData, pdfBuffer);

        if (emailResult.customerEmailSent) {
            await waiverService.markWaiverEmailSent(waiver.id);
        }

        res.status(201).json({
            success: true,
            data: {
                id: waiver.id,
                pdfPath: waiver.pdf_storage_path,
                signedAt: waiver.signed_at,
                emailSent: emailResult.customerEmailSent
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/waivers/me
 * Get current user's waiver
 */
router.get('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user?.id;
        const waiver = await waiverService.getWaiverByUserId(userId);

        res.json({
            success: true,
            data: waiver
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/waivers/check/:userId
 * Check if user has completed waiver
 */
router.get('/check/:userId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId } = req.params;
        const hasWaiver = await waiverService.hasCompletedWaiver(userId);

        res.json({
            success: true,
            data: { hasWaiver }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/waivers/download/:id
 * Download waiver PDF
 */
router.get('/download/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const waiver = await waiverService.getWaiverById(id);

        if (!waiver) {
            return res.status(404).json({
                success: false,
                error: 'Waiver not found'
            });
        }

        // Check authorization (user can download their own, staff/admin can download any)
        const requestingUserId = (req as any).user?.id;
        const requestingUserRole = (req as any).user?.role;

        if (waiver.user_id !== requestingUserId &&
            requestingUserRole !== 'staff' &&
            requestingUserRole !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Not authorized to download this waiver'
            });
        }

        const pdfBuffer = await waiverService.downloadWaiverPDF(waiver.pdf_storage_path);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="waiver_${id}.pdf"`);
        res.send(pdfBuffer);
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/waivers/:id
 * Get waiver by ID
 */
router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const waiver = await waiverService.getWaiverById(id);

        if (!waiver) {
            return res.status(404).json({
                success: false,
                error: 'Waiver not found'
            });
        }

        res.json({
            success: true,
            data: waiver
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/waivers
 * Get all waivers (admin only)
 */
router.get('/', authenticate, requireRole('admin', 'staff'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;

        const result = await waiverService.getAllWaivers(page, limit);

        res.json({
            success: true,
            data: result.waivers,
            total: result.total,
            page,
            limit,
            total_pages: result.totalPages
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/waivers/user/:userId
 * Get waiver by user ID (staff/admin only)
 */
router.get('/user/:userId', authenticate, requireRole('admin', 'staff'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId } = req.params;
        const waiver = await waiverService.getWaiverByUserId(userId);

        res.json({
            success: true,
            data: waiver
        });
    } catch (error) {
        next(error);
    }
});

export default router;
