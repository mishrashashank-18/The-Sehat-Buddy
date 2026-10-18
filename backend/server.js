import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import connectDB from './config/db.js';

import adminRoutes from './routes/adminRoutes.js';
import doctorRoutes from './routes/doctorRoutes.js';
import hospitalRoutes from './routes/hospitalRoutes.js';
import userRoutes from './routes/userRoutes.js';
import contentRoutes from './routes/contentRoutes.js';
import mapRoutes from './routes/mapRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import faqRoutes from './routes/faqRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import specialityRoutes from './routes/specialityRoutes.js';

import mongoSanitize from './middleware/mongoSanitize.js';

// Resolve directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from backend/.env (or root fallback)
dotenv.config({ path: path.resolve(__dirname, '.env') });

const NODE_ENV = process.env.NODE_ENV || 'development';
const DEV_JWT_FALLBACK = 'sehatbuddy_super_secure_jwt_secret_dev_fallback_2026';
const jwtSecret = process.env.JWT_SECRET;

// Fail-fast security validation on startup
if (NODE_ENV === 'production') {
  if (!jwtSecret || jwtSecret === DEV_JWT_FALLBACK) {
    console.error('FATAL SECURITY CONFIGURATION: JWT_SECRET must be set to a strong unique secret in production environment. Aborting startup.');
    process.exit(1);
  }
  if (jwtSecret.length < 32) {
    console.error('FATAL SECURITY CONFIGURATION: JWT_SECRET must be at least 32 characters in production. Aborting startup.');
    process.exit(1);
  }
} else {
  if (!jwtSecret || jwtSecret === DEV_JWT_FALLBACK) {
    console.warn('⚠️ SECURITY NOTICE: Running in development mode with developer JWT fallback secret. Set a 32+ character JWT_SECRET in .env before deploying to production.');
  }
}

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// 1. Security Headers via Helmet
app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: false
}));

// 2. Strict CORS Configuration
const allowedOrigins = [
  CLIENT_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || CLIENT_URL === '*') {
      callback(null, true);
    } else {
      callback(new Error(`Origin [${origin}] not allowed by CORS`));
    }
  },
  credentials: true
}));

// 3. Request Body Parser with payload limit
app.use(express.json({ limit: '10mb' }));

// 4. NoSQL Query & Body Sanitization (blocks operator injection like $gt, $where)
app.use(mongoSanitize);

// 4. Rate Limiting Protection
// General API rate limiter (500 requests per 15 minutes per IP)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes.' }
});
app.use('/api/', generalLimiter);

// Strict Authentication & OTP rate limiter (20 attempts per 15 minutes per IP)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts. Please try again after 15 minutes.' }
});

app.use('/api/user/login', authLimiter);
app.use('/api/user/register', authLimiter);
app.use('/api/user/verify-otp', authLimiter);
app.use('/api/doctors/login', authLimiter);
app.use('/api/doctors/forgot-password', authLimiter);
app.use('/api/doctors/verify-reset-otp', authLimiter);
app.use('/api/doctors/reset-password', authLimiter);
app.use('/api/hospitals/login', authLimiter);
app.use('/api/hospitals/forgot-password', authLimiter);
app.use('/api/hospitals/verify-reset-otp', authLimiter);
app.use('/api/hospitals/reset-password', authLimiter);
app.use('/api/admin/login', authLimiter);
app.use('/api/admin/register', authLimiter);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    environment: NODE_ENV,
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

// Overall stats API
app.get('/api/stats', (req, res) => {
  res.json({ success: true, data: { status: "Please use admin/dashboard" } });
});

// API Routes
app.use('/api/admin', adminRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/user', userRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/maps', mapRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/faqs', faqRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/specialities-procedures', specialityRoutes);

// 404 Route Catch-all
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err.message || err);
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    success: false,
    message: NODE_ENV === 'production' ? 'An internal server error occurred' : (err.message || 'Server error')
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🩺 The Sehat Buddy Backend API running in [${NODE_ENV}] mode at http://localhost:${PORT}`);
});

export default app;
