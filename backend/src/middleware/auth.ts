import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JwtPayload } from '../shared/jwt';
import { UserRole } from '../shared/types';

// Extend Express Request to include user
declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}

/**
 * Middleware to authenticate requests using JWT
 */
export function authenticate(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    // Get token from Authorization header or cookie
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
    } else if (req.cookies?.accessToken) {
        token = req.cookies.accessToken;
    }

    if (!token) {
        res.status(401).json({
            success: false,
            error: 'Authentication required',
        });
        return;
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
        res.status(401).json({
            success: false,
            error: 'Invalid or expired token',
        });
        return;
    }

    req.user = payload;
    next();
}

/**
 * Middleware to require specific roles
 */
export function requireRole(...roles: UserRole[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: 'Authentication required',
            });
            return;
        }

        if (!roles.includes(req.user.role as UserRole)) {
            res.status(403).json({
                success: false,
                error: 'Insufficient permissions',
            });
            return;
        }

        next();
    };
}

/**
 * Middleware to require admin role
 */
export const requireAdmin = requireRole('admin');

/**
 * Middleware to require staff or admin role
 */
export const requireStaffOrAdmin = requireRole('staff', 'admin');

/**
 * Middleware to check if user is accessing their own resource or is admin
 */
export function requireSelfOrAdmin(userIdParam: string = 'userId') {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: 'Authentication required',
            });
            return;
        }

        const targetUserId = req.params[userIdParam];
        const isSelf = req.user.userId === targetUserId;
        const isAdmin = req.user.role === 'admin';

        if (!isSelf && !isAdmin) {
            res.status(403).json({
                success: false,
                error: 'Access denied',
            });
            return;
        }

        next();
    };
}
