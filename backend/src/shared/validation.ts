import { z } from 'zod';

// ============================================
// AUTH VALIDATION SCHEMAS
// ============================================

export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    loginType: z.enum(['customer', 'staff'], {
        errorMap: () => ({ message: 'Login type must be "customer" or "staff"' }),
    }),
});

export const signupSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
    first_name: z.string().min(1, 'First name is required').max(100),
    last_name: z.string().min(1, 'Last name is required').max(100),
    phone: z.string().min(10, 'Phone number must be at least 10 digits'),
    birthday: z.string().optional(),
});

export const forgotPasswordSchema = z.object({
    email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
    token: z.string().min(1, 'Reset token is required'),
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
});

// ============================================
// USER VALIDATION SCHEMAS
// ============================================

export const updateUserSchema = z.object({
    first_name: z.string().min(1).max(100).optional(),
    last_name: z.string().min(1).max(100).optional(),
    phone: z.string().min(10).optional(),
    birthday: z.string().optional(),
});

export const createFamilyMemberSchema = z.object({
    first_name: z.string().min(1, 'First name is required').max(100),
    last_name: z.string().min(1, 'Last name is required').max(100),
    birthday: z.string().optional(),
});

// ============================================
// PUNCH CARD VALIDATION SCHEMAS
// ============================================

export const purchaseCardSchema = z.object({
    card_type_id: z.string().uuid('Invalid card type ID'),
    user_id: z.string().uuid('Invalid user ID').optional(),
    family_member_id: z.string().uuid('Invalid family member ID').optional(),
    payment_nonce: z.string().min(1, 'Payment nonce is required'),
}).refine(
    (data) => (data.user_id && !data.family_member_id) || (!data.user_id && data.family_member_id),
    { message: 'Either user_id or family_member_id must be provided, but not both' }
);

export const adminCreateCardSchema = z.object({
    user_id: z.string().uuid('Invalid user ID').optional(),
    family_member_id: z.string().uuid('Invalid family member ID').optional(),
    classes: z.number().int().min(1, 'Classes must be at least 1').max(100),
    expiration_date: z.string().min(1, 'Expiration date is required'),
    amount_paid: z.number().min(0, 'Amount paid cannot be negative'),
    notes: z.string().optional(),
}).refine(
    (data) => (data.user_id && !data.family_member_id) || (!data.user_id && data.family_member_id),
    { message: 'Either user_id or family_member_id must be provided, but not both' }
);

// ============================================
// CHECK-IN VALIDATION SCHEMAS
// ============================================

export const checkInSchema = z.object({
    user_id: z.string().uuid('Invalid user ID').optional(),
    family_member_id: z.string().uuid('Invalid family member ID').optional(),
    qr_code: z.string().optional(),
    use_birthday_pass: z.boolean().optional().default(false),
    is_birthday_checkin: z.boolean().optional().default(false),  // Direct birthday check-in (no pass needed)
    notes: z.string().optional(),
}).refine(
    (data) => data.qr_code || data.user_id || data.family_member_id,
    { message: 'QR code, user_id, or family_member_id must be provided' }
);

export const searchUserSchema = z.object({
    query: z.string().min(1, 'Search query is required'),
});

// ============================================
// WAIVER VALIDATION SCHEMAS
// ============================================

export const waiverFormSchema = z.object({
    first_name: z.string().min(1).max(100),
    last_name: z.string().min(1).max(100),
    email: z.string().email(),
    phone: z.string().min(10),
    address: z.string().min(1, 'Address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    zip_code: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format'),
    birthday: z.string().min(1, 'Birthday is required'),
    gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']),
    occupation: z.string().min(1, 'Occupation is required'),
    source: z.string().min(1, 'Source is required'),
    signature_data_url: z.string().min(1, 'Signature is required'),
    signature_date: z.string().min(1),
});

export const submitWaiverSchema = z.object({
    user_id: z.string().uuid().optional(),
    family_member_id: z.string().uuid().optional(),
    form_data: waiverFormSchema,
}).refine(
    (data) => (data.user_id && !data.family_member_id) || (!data.user_id && data.family_member_id),
    { message: 'Either user_id or family_member_id must be provided, but not both' }
);

// ============================================
// NOTIFICATION VALIDATION SCHEMAS
// ============================================

export const updateNotificationPrefsSchema = z.object({
    email_enabled: z.boolean().optional(),
    sms_enabled: z.boolean().optional(),
    marketing_enabled: z.boolean().optional(),
});

// ============================================
// PAGINATION SCHEMA
// ============================================

export const paginationSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const dateRangeSchema = z.object({
    start_date: z.string().optional(),
    end_date: z.string().optional(),
});

// ============================================
// HELPER FUNCTION
// ============================================

export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): {
    success: boolean;
    data?: T;
    errors?: string[];
} {
    const result = schema.safeParse(data);

    if (result.success) {
        return { success: true, data: result.data };
    }

    const errors = result.error.errors.map(
        (err) => `${err.path.join('.')}: ${err.message}`
    );

    return { success: false, errors };
}
