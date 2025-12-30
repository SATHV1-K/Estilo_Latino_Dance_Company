import { Router, Request, Response, NextFunction } from 'express';
import * as paymentService from './paymentService';
import { authenticate } from '../../middleware/auth';

const router = Router();

/**
 * GET /api/payments/config
 * Get payment configuration for frontend (public)
 */
router.get('/config', (req: Request, res: Response) => {
    const config = paymentService.getPaymentConfig();
    res.json({
        success: true,
        data: config
    });
});

/**
 * POST /api/payments/calculate
 * Calculate total with tax for a card type
 */
router.post('/calculate', async (req: Request, res: Response) => {
    try {
        const { subtotalCents } = req.body;

        if (!subtotalCents || typeof subtotalCents !== 'number') {
            return res.status(400).json({
                success: false,
                error: 'subtotalCents is required'
            });
        }

        const taxCents = paymentService.calculateTax(subtotalCents);
        const totalCents = subtotalCents + taxCents;
        const taxRate = paymentService.getTaxRate();

        res.json({
            success: true,
            data: {
                subtotalCents,
                taxCents,
                totalCents,
                taxRate,
                subtotal: subtotalCents / 100,
                tax: taxCents / 100,
                total: totalCents / 100
            }
        });
    } catch (error) {
        console.error('Error calculating total:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to calculate total'
        });
    }
});

/**
 * POST /api/payments/process
 * Process a payment (requires authentication)
 */
router.post('/process', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;
        const { sourceId, cardTypeId, amountCents, customerEmail, tipCents } = req.body;

        console.log('💳 Payment request - userId:', userId, 'tip:', tipCents ? `$${tipCents / 100}` : 'none');  // Debug log

        // Validate required fields
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'User not authenticated'
            });
        }

        if (!sourceId || !cardTypeId || !amountCents) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: sourceId, cardTypeId, amountCents'
            });
        }

        const result = await paymentService.processPayment({
            sourceId,
            cardTypeId,
            userId,
            amountCents,
            customerEmail,
            tipCents: tipCents || 0
        });

        if (!result.success) {
            return res.status(400).json({
                success: false,
                error: result.error
            });
        }

        res.status(201).json({
            success: true,
            data: result,
            message: 'Payment processed successfully'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/payments/history
 * Get user's payment history
 */
router.get('/history', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'User not authenticated'
            });
        }
        const limit = parseInt(req.query.limit as string) || 10;

        const payments = await paymentService.getUserPayments(userId, limit);

        res.json({
            success: true,
            data: payments
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/payments/tips/stats
 * Get tip statistics for admin dashboard (requires admin auth)
 */
router.get('/tips/stats', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Check if user is admin
        if (req.user?.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Admin access required'
            });
        }

        const tipStats = await paymentService.getTipStats();

        res.json({
            success: true,
            data: tipStats
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/payments/:id
 * Get payment details by ID
 */
router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const payment = await paymentService.getPaymentById(id);

        if (!payment) {
            return res.status(404).json({
                success: false,
                error: 'Payment not found'
            });
        }

        res.json({
            success: true,
            data: payment
        });
    } catch (error) {
        next(error);
    }
});

export default router;
