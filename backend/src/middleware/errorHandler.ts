import { Request, Response, NextFunction } from 'express';

export interface ApiError extends Error {
    statusCode?: number;
    errors?: string[];
}

/**
 * Global error handling middleware
 */
export function errorHandler(
    err: ApiError,
    req: Request,
    res: Response,
    next: NextFunction
): void {
    console.error('Error:', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
    });

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal server error';

    res.status(statusCode).json({
        success: false,
        error: message,
        errors: err.errors,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
}

/**
 * 404 handler for unknown routes
 */
export function notFoundHandler(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    res.status(404).json({
        success: false,
        error: `Route not found: ${req.method} ${req.path}`,
    });
}

/**
 * Create a custom API error
 */
export function createError(message: string, statusCode: number = 500, errors?: string[]): ApiError {
    const error = new Error(message) as ApiError;
    error.statusCode = statusCode;
    error.errors = errors;
    return error;
}

/**
 * Async handler wrapper to catch async errors
 */
export function asyncHandler(
    fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
