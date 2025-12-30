import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import middleware
import { errorHandler, notFoundHandler } from './middleware';

// Import routes
import { authRoutes } from './services/auth';
import { userRoutes } from './services/users';
import { cardRoutes } from './services/cards';
import { checkInRoutes } from './services/checkins';
import { analyticsRoutes } from './services/analytics';
import { waiverRoutes } from './services/waivers';
import { paymentRoutes } from './services/payments';
import birthdayRoutes from './services/birthday/routes';
import notificationRoutes from './services/notifications/routes';

// Import scheduled jobs
import { startScheduledJobs } from './jobs';
import { initializeScheduler } from './services/notifications/scheduler';

const app: Express = express();
const PORT = process.env.PORT || 3001;

// ============================================
// MIDDLEWARE
// ============================================

// Security headers
app.use(helmet());

// Trust proxy for Railway (fixes express-rate-limit X-Forwarded-For warning)
app.set('trust proxy', 1);

// CORS configuration
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.FRONTEND_URL,
].filter(Boolean) as string[];

const corsOptions = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // Allow any Railway domain or localhost
        if (origin.includes('.up.railway.app') ||
            origin.includes('localhost') ||
            allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Parse cookies
app.use(cookieParser());

// Rate limiting - general
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // 1000 requests per 15 minutes
    message: { success: false, error: 'Too many requests, please try again later' },
});
app.use(generalLimiter);

// Rate limiting - auth endpoints (stricter)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // 20 login attempts per 15 minutes
    message: { success: false, error: 'Too many login attempts, please try again later' },
});

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req: Request, res: Response) => {
    res.json({
        success: true,
        message: 'Estilo Latino Dance Studio API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
    });
});

// ============================================
// API ROUTES
// ============================================

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/checkins', checkInRoutes);
app.use('/api/analytics', analyticsRoutes);

// Placeholder routes for services to be implemented
app.use('/api/payments', paymentRoutes);

app.use('/api/waivers', waiverRoutes);

app.use('/api/birthday', birthdayRoutes);

app.use('/api/notifications', notificationRoutes);

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// ============================================
// START SERVER
// ============================================

async function startServer() {
    try {
        // Start scheduled jobs
        if (process.env.NODE_ENV !== 'test') {
            startScheduledJobs();
            initializeScheduler(); // Start notification scheduler
        }

        app.listen(PORT, () => {
            console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🎭 Estilo Latino Dance Studio API                          ║
║                                                               ║
║   Server running on port ${PORT}                               ║
║   Environment: ${(process.env.NODE_ENV || 'development').padEnd(40)}║
║                                                               ║
║   API Endpoints:                                              ║
║   - Auth:       /api/auth                                     ║
║   - Users:      /api/users                                    ║
║   - Cards:      /api/cards                                    ║
║   - Check-ins:  /api/checkins                                 ║
║   - Analytics:  /api/analytics                                ║
║   - Payments:   /api/payments                                 ║
║   - Waivers:    /api/waivers                                  ║
║   - Notifications: /api/notifications                         ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
      `);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();

export default app;
