// Shared TypeScript types for the application

// ============================================
// USER TYPES
// ============================================

export type UserRole = 'customer' | 'staff' | 'admin';
export type LoginType = 'customer' | 'staff';

export interface User {
    id: string;
    email: string;
    phone: string | null;
    password_hash?: string;
    role: UserRole;
    first_name: string;
    last_name: string;
    birthday: string | null;
    qr_code: string | null;
    check_in_code: string | null;
    email_verified: boolean;
    created_at: string;
    updated_at: string;
}

export interface UserPublic {
    id: string;
    email: string;
    phone: string | null;
    role: UserRole;
    first_name: string;
    last_name: string;
    birthday: string | null;
    qr_code: string | null;
    check_in_code: string | null;
    email_verified: boolean;
    created_at: string;
}

export interface FamilyMember {
    id: string;
    primary_user_id: string;
    first_name: string;
    last_name: string;
    birthday: string | null;
    qr_code: string | null;
    check_in_code: string | null;
    has_waiver: boolean;
    created_at: string;
}

// ============================================
// PUNCH CARD TYPES
// ============================================

export type CardStatus = 'active' | 'expired' | 'exhausted';
export type PaymentMethod = 'online' | 'cash' | 'admin_created';

export interface CardType {
    id: string;
    name: string;
    classes: number;
    expiration_months: number;
    price: number;
    price_per_class: number;
    description: string | null;
    is_active: boolean;
    created_at: string;
}

export interface PunchCard {
    id: string;
    user_id: string | null;
    family_member_id: string | null;
    card_type_id: string;
    total_classes: number;
    classes_remaining: number;
    purchase_date: string;
    expiration_date: string;
    amount_paid: number;
    status: CardStatus;
    payment_method: PaymentMethod;
    square_payment_id: string | null;
    created_by: string | null;
    created_at: string;
    updated_at: string;
}

export interface PunchCardWithDetails extends PunchCard {
    card_type?: CardType;
    owner_name?: string;
    owner_type?: 'user' | 'family_member';
}

// ============================================
// CHECK-IN TYPES
// ============================================

export interface CheckIn {
    id: string;
    user_id: string | null;
    family_member_id: string | null;
    punch_card_id: string | null;
    is_birthday_checkin: boolean;
    birthday_pass_id: string | null;
    checked_in_at: string;
    punched_by_user_id: string;
    notes: string | null;
}

export interface CheckInWithDetails extends CheckIn {
    person_name: string;
    card_name: string | null;
    punched_by_name: string;
    classes_remaining?: number;
}

// ============================================
// WAIVER TYPES
// ============================================

export type GenderType = 'male' | 'female' | 'other' | 'prefer_not_to_say';

export interface WaiverFormData {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zip_code: string;
    birthday: string;
    gender: GenderType;
    occupation: string;
    source: string;
    signature_data_url: string;
    signature_date: string;
}

export interface Waiver {
    id: string;
    user_id: string | null;
    family_member_id: string | null;
    form_data: WaiverFormData;
    signature_url: string;
    pdf_storage_path: string;
    signed_at: string;
    email_sent: boolean;
}

// ============================================
// BIRTHDAY PASS TYPES
// ============================================

export interface BirthdayPass {
    id: string;
    user_id: string | null;
    family_member_id: string | null;
    valid_date: string;
    expires_at: string;
    used: boolean;
    used_at: string | null;
    check_in_id: string | null;
    created_at: string;
}

// ============================================
// PAYMENT TYPES
// ============================================

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface Payment {
    id: string;
    user_id: string;
    punch_card_id: string | null;
    amount: number;
    square_payment_id: string | null;
    status: PaymentStatus;
    square_response: Record<string, any> | null;
    created_at: string;
}

// ============================================
// NOTIFICATION TYPES
// ============================================

export type NotificationType = 'welcome' | 'birthday' | 'low_balance' | 'expiring' | 'expired' | 'checkin';
export type NotificationChannel = 'email' | 'sms';

export interface NotificationPreferences {
    id: string;
    user_id: string;
    email_enabled: boolean;
    sms_enabled: boolean;
    marketing_enabled: boolean;
    created_at: string;
    updated_at: string;
}

export interface NotificationLog {
    id: string;
    user_id: string | null;
    family_member_id: string | null;
    notification_type: NotificationType;
    channel: NotificationChannel;
    recipient: string;
    subject: string | null;
    content: string | null;
    status: string;
    external_id: string | null;
    error_message: string | null;
    sent_at: string;
}

// ============================================
// AUTH TYPES
// ============================================

export interface PasswordResetToken {
    id: string;
    user_id: string;
    token_hash: string;
    expires_at: string;
    used: boolean;
    created_at: string;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

export interface LoginRequest {
    email: string;
    password: string;
    loginType: LoginType;
}

export interface SignupRequest {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone: string;
    birthday?: string;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
}

// ============================================
// ANALYTICS TYPES
// ============================================

export interface DashboardStats {
    today_checkins: number;
    active_cards: number;
    new_cards_today: number;
    total_revenue_today: number;
    total_revenue_month: number;
    new_customers_month: number;
    expiring_cards_week: number;
}

export interface RevenueByCardType {
    card_type_name: string;
    total_sold: number;
    total_revenue: number;
}

export interface AttendanceTrend {
    date: string;
    checkins: number;
}
