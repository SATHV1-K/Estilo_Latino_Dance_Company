import { Client, Environment, ApiError } from 'square';
import { supabaseAdmin } from '../../shared/supabase';
import { randomUUID } from 'crypto';
import { sendPurchaseConfirmationEmail } from '../notifications/notificationService';

// Initialize Square client
const squareClient = new Client({
    accessToken: process.env.SQUARE_ACCESS_TOKEN,
    environment: process.env.SQUARE_ENVIRONMENT === 'production'
        ? Environment.Production
        : Environment.Sandbox
});

const paymentsApi = squareClient.paymentsApi;

// Tax rate from environment (default 6.625% NJ sales tax)
const TAX_RATE = parseFloat(process.env.TAX_RATE || '0.06625');

export interface PaymentRequest {
    sourceId: string;  // Card nonce from Square Web Payments SDK
    cardTypeId: string;
    userId: string;
    amountCents: number;
    customerEmail?: string;
    tipCents?: number;  // Optional tip amount in cents
}

export interface PaymentResult {
    success: boolean;
    paymentId?: string;
    punchCardId?: string;
    squarePaymentId?: string;
    receiptUrl?: string;
    error?: string;
}

/**
 * Calculate tax amount based on subtotal
 */
export function calculateTax(subtotalCents: number): number {
    return Math.round(subtotalCents * TAX_RATE);
}

/**
 * Get current tax rate
 */
export function getTaxRate(): number {
    return TAX_RATE;
}

/**
 * Get public payment configuration (safe to expose to frontend)
 */
export function getPaymentConfig() {
    return {
        applicationId: process.env.SQUARE_APPLICATION_ID,
        locationId: process.env.SQUARE_LOCATION_ID,
        environment: process.env.SQUARE_ENVIRONMENT || 'sandbox',
        taxRate: TAX_RATE
    };
}

/**
 * Process a payment using Square
 */
export async function processPayment(request: PaymentRequest): Promise<PaymentResult> {
    const { sourceId, cardTypeId, userId, amountCents, customerEmail, tipCents = 0 } = request;

    // Calculate tax and total (tip is added on top)
    const taxCents = calculateTax(amountCents);
    const totalCentsWithoutTip = amountCents + taxCents;
    const totalCents = totalCentsWithoutTip + tipCents;

    console.log('💳 Processing payment:', {
        subtotal: amountCents / 100,
        tax: taxCents / 100,
        tip: tipCents / 100,
        total: totalCents / 100,
        userId
    });

    try {
        // 1. Create payment with Square
        const idempotencyKey = randomUUID();

        // Prepare payment request with optional tip
        const paymentRequest: any = {
            sourceId,
            idempotencyKey,
            amountMoney: {
                amount: BigInt(totalCents),
                currency: 'USD'
            },
            locationId: process.env.SQUARE_LOCATION_ID,
            note: tipCents > 0
                ? `Punch card purchase - Card Type ID: ${cardTypeId} (includes $${(tipCents / 100).toFixed(2)} tip)`
                : `Punch card purchase - Card Type ID: ${cardTypeId}`,
            buyerEmailAddress: customerEmail
        };

        // Add tip money if a tip was provided (Square tracks tips separately)
        if (tipCents > 0) {
            paymentRequest.tipMoney = {
                amount: BigInt(tipCents),
                currency: 'USD'
            };
        }

        const { result } = await paymentsApi.createPayment(paymentRequest);

        if (!result.payment || result.payment.status !== 'COMPLETED') {
            console.error('❌ Payment not completed:', result);
            return {
                success: false,
                error: 'Payment was not completed'
            };
        }

        console.log('✅ Square payment successful:', result.payment.id);

        // 2. Get card type details
        const { data: cardType, error: cardTypeError } = await supabaseAdmin
            .from('card_types')
            .select('*')
            .eq('id', cardTypeId)
            .single();

        if (cardTypeError || !cardType) {
            console.error('❌ Card type not found:', cardTypeError);
            // Refund would go here in production
            return {
                success: false,
                error: 'Card type not found'
            };
        }

        // 2b. Get user details for name
        const { data: userData } = await supabaseAdmin
            .from('users')
            .select('first_name, last_name')
            .eq('id', userId)
            .single();

        const firstName = userData?.first_name || '';
        const lastName = userData?.last_name || '';

        // 3. Calculate expiration date
        const purchaseDate = new Date();
        const expirationDate = new Date(purchaseDate);
        expirationDate.setMonth(expirationDate.getMonth() + cardType.expiration_months);

        // 4. Create punch card
        const punchCardData = {
            user_id: userId,
            family_member_id: null,
            card_type_id: cardTypeId,
            total_classes: cardType.classes,
            classes_remaining: cardType.classes,
            purchase_date: purchaseDate.toISOString().split('T')[0],
            expiration_date: expirationDate.toISOString().split('T')[0],
            amount_paid: totalCents / 100,
            status: 'active',
            payment_method: 'online',
            square_payment_id: result.payment.id,
            first_name: firstName,
            last_name: lastName
        };

        console.log('📝 Attempting to insert punch card:', JSON.stringify(punchCardData, null, 2));

        const { data: punchCard, error: cardError } = await supabaseAdmin
            .from('punch_cards')
            .insert(punchCardData)
            .select()
            .single();

        if (cardError) {
            console.error('❌ Error creating punch card:', JSON.stringify(cardError, null, 2));
            console.error('❌ Full error details:', cardError.message, cardError.code, cardError.details, cardError.hint);
            // Refund would go here in production
            return {
                success: false,
                error: `Failed to create punch card: ${cardError.message || cardError.code || 'Unknown error'}`
            };
        }

        console.log('✅ Punch card created:', punchCard.id);

        // 5b. Send purchase confirmation email (async, don't block)
        const { data: userEmail } = await supabaseAdmin
            .from('users')
            .select('email, check_in_code')
            .eq('id', userId)
            .single();

        if (userEmail?.email) {
            sendPurchaseConfirmationEmail(
                userId,
                `${firstName} ${lastName}`,
                userEmail.email,
                userEmail.check_in_code || 'N/A',
                cardType.name,
                cardType.classes,
                punchCard.expiration_date,
                totalCents / 100
            ).then(() => {
                console.log(`✅ Purchase confirmation email sent to ${userEmail.email}`);
            }).catch(err => {
                console.error('Error sending purchase confirmation email:', err);
            });
        }

        // 6. Record payment in database
        const { error: paymentError } = await supabaseAdmin
            .from('payments')
            .insert({
                user_id: userId,
                punch_card_id: punchCard.id,
                amount: totalCents / 100,
                tax_amount: taxCents / 100,
                subtotal: amountCents / 100,
                tip_amount: tipCents / 100,  // Store tip amount
                square_payment_id: result.payment.id,
                status: 'completed',
                first_name: firstName,
                last_name: lastName,
                square_response: JSON.parse(JSON.stringify(result.payment, (_, v) =>
                    typeof v === 'bigint' ? v.toString() : v
                ))
            });

        if (paymentError) {
            console.error('⚠️ Error recording payment (card created):', paymentError);
            // Non-critical - card was created, just logging failed
        }

        return {
            success: true,
            paymentId: result.payment.id,
            punchCardId: punchCard.id,
            squarePaymentId: result.payment.id,
            receiptUrl: result.payment.receiptUrl
        };

    } catch (error) {
        console.error('❌ Square API error:', error);

        if (error instanceof ApiError) {
            const errorMessages = error.errors?.map(e => e.detail).join(', ') || 'Unknown error';
            return {
                success: false,
                error: `Payment failed: ${errorMessages}`
            };
        }

        return {
            success: false,
            error: 'Payment processing failed'
        };
    }
}

/**
 * Get payment by ID
 */
export async function getPaymentById(paymentId: string) {
    const { data, error } = await supabaseAdmin
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .single();

    if (error) {
        return null;
    }
    return data;
}

/**
 * Get user's payment history
 */
export async function getUserPayments(userId: string, limit: number = 10) {
    const { data, error } = await supabaseAdmin
        .from('payments')
        .select('*, punch_cards(card_type_id, total_classes)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        return [];
    }
    return data;
}

/**
 * Get tip statistics for admin dashboard
 */
export async function getTipStats() {
    // Get current month's start date
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get all completed payments with tips
    const { data: allTips, error: allTipsError } = await supabaseAdmin
        .from('payments')
        .select('tip_amount, created_at')
        .eq('status', 'completed')
        .gt('tip_amount', 0);

    if (allTipsError) {
        console.error('Error fetching tip stats:', allTipsError);
        return {
            totalTips: 0,
            thisMonthTips: 0,
            tipCount: 0,
            thisMonthTipCount: 0
        };
    }

    // Calculate totals
    let totalTips = 0;
    let thisMonthTips = 0;
    let tipCount = 0;
    let thisMonthTipCount = 0;

    (allTips || []).forEach((payment: any) => {
        const tip = parseFloat(payment.tip_amount) || 0;
        const paymentDate = new Date(payment.created_at);

        if (tip > 0) {
            totalTips += tip;
            tipCount++;

            if (paymentDate >= startOfMonth) {
                thisMonthTips += tip;
                thisMonthTipCount++;
            }
        }
    });

    return {
        totalTips: Math.round(totalTips * 100) / 100,
        thisMonthTips: Math.round(thisMonthTips * 100) / 100,
        tipCount,
        thisMonthTipCount
    };
}
