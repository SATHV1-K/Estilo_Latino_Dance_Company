import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin } from './supabase';

// Characters to use for check-in codes (excluding confusing ones: O, 0, I, 1, L)
const CHECK_IN_CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/**
 * Generate a random 4-character check-in code
 */
export function generateCheckInCode(): string {
    let code = '';
    for (let i = 0; i < 4; i++) {
        code += CHECK_IN_CODE_CHARS.charAt(Math.floor(Math.random() * CHECK_IN_CODE_CHARS.length));
    }
    return code;
}

/**
 * Generate a unique check-in code by checking database
 */
export async function generateUniqueCheckInCode(): Promise<string> {
    let attempts = 0;
    const maxAttempts = 100;

    while (attempts < maxAttempts) {
        const code = generateCheckInCode();

        // Check if code exists in users or family_members table
        const { data: userMatch } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('check_in_code', code)
            .maybeSingle();

        const { data: familyMatch } = await supabaseAdmin
            .from('family_members')
            .select('id')
            .eq('check_in_code', code)
            .maybeSingle();

        if (!userMatch && !familyMatch) {
            return code;
        }

        attempts++;
    }

    throw new Error('Failed to generate unique check-in code after max attempts');
}

/**
 * Generate a unique QR code identifier for a user or family member
 */
export function generateQRCodeId(entityId: string, type: 'user' | 'family_member'): string {
    const timestamp = Date.now().toString(36);
    const random = uuidv4().split('-')[0];
    return `ELDC_${type.toUpperCase()}_${entityId}_${timestamp}_${random}`;
}

/**
 * Generate a QR code data URL (base64 PNG)
 */
export async function generateQRCodeDataUrl(data: string): Promise<string> {
    try {
        const qrCodeDataUrl = await QRCode.toDataURL(data, {
            errorCorrectionLevel: 'M',
            type: 'image/png',
            margin: 2,
            width: 256,
            color: {
                dark: '#000000',
                light: '#FFFFFF',
            },
        });
        return qrCodeDataUrl;
    } catch (error) {
        console.error('Error generating QR code:', error);
        throw new Error('Failed to generate QR code');
    }
}

/**
 * Generate a QR code as SVG string
 */
export async function generateQRCodeSVG(data: string): Promise<string> {
    try {
        const svg = await QRCode.toString(data, {
            type: 'svg',
            errorCorrectionLevel: 'M',
            margin: 2,
            width: 256,
        });
        return svg;
    } catch (error) {
        console.error('Error generating QR code SVG:', error);
        throw new Error('Failed to generate QR code');
    }
}

/**
 * Parse a QR code to extract entity information
 */
export function parseQRCode(qrCode: string): {
    type: 'user' | 'family_member' | null;
    entityId: string | null;
    isValid: boolean;
} {
    // Expected format: ELDC_USER_<uuid>_<timestamp>_<random> or ELDC_FAMILY_MEMBER_<uuid>_<timestamp>_<random>
    if (!qrCode || !qrCode.startsWith('ELDC_')) {
        return { type: null, entityId: null, isValid: false };
    }

    const parts = qrCode.split('_');
    if (parts.length < 4) {
        return { type: null, entityId: null, isValid: false };
    }

    if (parts[1] === 'USER') {
        return {
            type: 'user',
            entityId: parts[2],
            isValid: true
        };
    } else if (parts[1] === 'FAMILY' && parts[2] === 'MEMBER') {
        return {
            type: 'family_member',
            entityId: parts[3],
            isValid: true
        };
    }

    return { type: null, entityId: null, isValid: false };
}
