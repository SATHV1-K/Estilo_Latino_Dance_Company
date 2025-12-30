import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { supabaseAdmin } from '../../shared/supabase';
import { generateTokens, verifyRefreshToken } from '../../shared/jwt';
import { generateQRCodeId, generateUniqueCheckInCode } from '../../shared/qr';
import {
    User,
    UserPublic,
    AuthTokens,
    LoginType,
    NotificationPreferences
} from '../../shared/types';

const SALT_ROUNDS = 12;

/**
 * Convert User to UserPublic (remove password_hash)
 */
function toPublicUser(user: User): UserPublic {
    const { password_hash, ...publicUser } = user;
    return publicUser;
}

/**
 * Capitalize first letter of each word in a name
 */
function capitalizeName(name: string): string {
    return name.trim()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

/**
 * Register a new customer account
 */
export async function registerUser(data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone: string;
    birthday?: string;
}): Promise<{ user: UserPublic; tokens: AuthTokens }> {
    // Check if email already exists
    const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', data.email.toLowerCase())
        .single();

    if (existingUser) {
        throw new Error('Email already registered');
    }

    // Hash password
    const password_hash = await bcrypt.hash(data.password, SALT_ROUNDS);

    // Generate QR code
    const tempId = crypto.randomUUID();
    const qr_code = generateQRCodeId(tempId, 'user');

    // Create user
    const { data: newUser, error } = await supabaseAdmin
        .from('users')
        .insert({
            email: data.email.toLowerCase(),
            password_hash,
            first_name: capitalizeName(data.first_name),
            last_name: capitalizeName(data.last_name),
            phone: data.phone,
            birthday: data.birthday || null,
            role: 'customer',
            qr_code,
            email_verified: false,
        })
        .select()
        .single();

    if (error || !newUser) {
        console.error('Error creating user:', error);
        throw new Error('Failed to create account');
    }

    // Update QR code with actual user ID and generate check-in code
    const finalQrCode = generateQRCodeId(newUser.id, 'user');
    const checkInCode = await generateUniqueCheckInCode();

    await supabaseAdmin
        .from('users')
        .update({ qr_code: finalQrCode, check_in_code: checkInCode })
        .eq('id', newUser.id);

    newUser.qr_code = finalQrCode;
    newUser.check_in_code = checkInCode;

    // Create default notification preferences
    await supabaseAdmin
        .from('notification_preferences')
        .insert({
            user_id: newUser.id,
            email_enabled: true,
            sms_enabled: true,
            marketing_enabled: true,
        });

    const publicUser = toPublicUser(newUser);
    const tokens = generateTokens(publicUser);

    return { user: publicUser, tokens };
}

/**
 * Authenticate a user
 */
export async function loginUser(
    email: string,
    password: string,
    loginType: LoginType
): Promise<{ user: UserPublic; tokens: AuthTokens }> {
    // Get user by email
    const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase())
        .single();

    if (error || !user) {
        throw new Error('Invalid credentials');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
        throw new Error('Invalid credentials');
    }

    // Validate login type matches user role
    // Customer can only login via 'customer' loginType
    // Staff and Admin can only login via 'staff' loginType
    if (loginType === 'customer' && user.role !== 'customer') {
        throw new Error('Invalid credentials or wrong login type');
    }
    if (loginType === 'staff' && user.role === 'customer') {
        throw new Error('Invalid credentials or wrong login type');
    }

    const publicUser = toPublicUser(user);
    const tokens = generateTokens(publicUser);

    return { user: publicUser, tokens };
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(
    refreshToken: string
): Promise<{ user: UserPublic; tokens: AuthTokens }> {
    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
        throw new Error('Invalid refresh token');
    }

    // Get fresh user data
    const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', payload.userId)
        .single();

    if (error || !user) {
        throw new Error('User not found');
    }

    const publicUser = toPublicUser(user);
    const tokens = generateTokens(publicUser);

    return { user: publicUser, tokens };
}

/**
 * Request password reset - generates token and returns it (sends email separately)
 */
export async function requestPasswordReset(email: string): Promise<{
    success: boolean;
    token?: string;
    user?: UserPublic;
}> {
    const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase())
        .single();

    // Return success even if user not found (prevents email enumeration)
    if (error || !user) {
        return { success: true };
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Invalidate any existing tokens
    await supabaseAdmin
        .from('password_reset_tokens')
        .update({ used: true })
        .eq('user_id', user.id)
        .eq('used', false);

    // Create new token
    await supabaseAdmin
        .from('password_reset_tokens')
        .insert({
            user_id: user.id,
            token_hash: tokenHash,
            expires_at: expiresAt.toISOString(),
            used: false,
        });

    return {
        success: true,
        token,
        user: toPublicUser(user),
    };
}

/**
 * Reset password using token
 */
export async function resetPassword(
    token: string,
    newPassword: string
): Promise<{ success: boolean }> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find valid token
    const { data: resetToken, error } = await supabaseAdmin
        .from('password_reset_tokens')
        .select('*')
        .eq('token_hash', tokenHash)
        .eq('used', false)
        .gt('expires_at', new Date().toISOString())
        .single();

    if (error || !resetToken) {
        throw new Error('Invalid or expired reset token');
    }

    // Hash new password
    const password_hash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update password
    const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ password_hash })
        .eq('id', resetToken.user_id);

    if (updateError) {
        throw new Error('Failed to reset password');
    }

    // Mark token as used
    await supabaseAdmin
        .from('password_reset_tokens')
        .update({ used: true })
        .eq('id', resetToken.id);

    return { success: true };
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<UserPublic | null> {
    const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

    if (error || !user) {
        return null;
    }

    return toPublicUser(user);
}

/**
 * Verify email (for future implementation)
 */
export async function verifyEmail(userId: string): Promise<boolean> {
    const { error } = await supabaseAdmin
        .from('users')
        .update({ email_verified: true })
        .eq('id', userId);

    return !error;
}

/**
 * Change password (for logged in users)
 */
export async function changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
): Promise<{ success: boolean }> {
    // Get user with password
    const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

    if (error || !user) {
        throw new Error('User not found');
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValid) {
        throw new Error('Current password is incorrect');
    }

    // Hash and update new password
    const password_hash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ password_hash })
        .eq('id', userId);

    if (updateError) {
        throw new Error('Failed to change password');
    }

    return { success: true };
}

/**
 * Update user profile (phone and address only)
 */
export async function updateProfile(userId: string, data: {
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zip_code?: string;
}): Promise<{ user: UserPublic }> {
    // Build update object with only provided fields
    const updateData: Record<string, string> = {};
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.state !== undefined) updateData.state = data.state;
    if (data.zip_code !== undefined) updateData.zip_code = data.zip_code;

    if (Object.keys(updateData).length === 0) {
        throw new Error('No fields to update');
    }

    const { data: updatedUser, error } = await supabaseAdmin
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

    if (error || !updatedUser) {
        console.error('Error updating profile:', error);
        throw new Error('Failed to update profile');
    }

    return { user: toPublicUser(updatedUser) };
}

