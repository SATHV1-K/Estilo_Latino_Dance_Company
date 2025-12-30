import jwt from 'jsonwebtoken';
import { UserPublic, AuthTokens } from './types';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_do_not_use_in_production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_do_not_use_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export interface JwtPayload {
    userId: string;
    email: string;
    role: string;
    type: 'access' | 'refresh';
}

/**
 * Generate access and refresh tokens for a user
 */
export function generateTokens(user: UserPublic): AuthTokens {
    const accessPayload: JwtPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        type: 'access',
    };

    const refreshPayload: JwtPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        type: 'refresh',
    };

    const accessOptions = {
        expiresIn: JWT_EXPIRES_IN,
    } as any;

    const refreshOptions = {
        expiresIn: JWT_REFRESH_EXPIRES_IN,
    } as any;

    const accessToken = jwt.sign(accessPayload, JWT_SECRET, accessOptions);
    const refreshToken = jwt.sign(refreshPayload, JWT_REFRESH_SECRET, refreshOptions);

    return { accessToken, refreshToken };
}

/**
 * Verify an access token and return the payload
 */
export function verifyAccessToken(token: string): JwtPayload | null {
    try {
        const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
        if (payload.type !== 'access') {
            return null;
        }
        return payload;
    } catch (error) {
        return null;
    }
}

/**
 * Verify a refresh token and return the payload
 */
export function verifyRefreshToken(token: string): JwtPayload | null {
    try {
        const payload = jwt.verify(token, JWT_REFRESH_SECRET) as JwtPayload;
        if (payload.type !== 'refresh') {
            return null;
        }
        return payload;
    } catch (error) {
        return null;
    }
}

/**
 * Decode a token without verification (for debugging)
 */
export function decodeToken(token: string): JwtPayload | null {
    try {
        return jwt.decode(token) as JwtPayload;
    } catch (error) {
        return null;
    }
}
