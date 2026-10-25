import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import connectDB from './config/db.js';
import { initHospitalPublicationAndCompletion } from './utils/hospitalMigration.js';

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
import newsletterRoutes from './routes/newsletterRoutes.js';
import avatarRoutes from './routes/avatarRoutes.js';

import mongoSanitize from './middleware/mongoSanitize.js';
import { initMongoDBChangeStream, streamRealtimeDatabase } from './services/storageMonitor.js';

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

// Connect to MongoDB & Initialize Realtime Change Stream
connectDB().then(() => {
  initMongoDBChangeStream();
  initHospitalPublicationAndCompletion();
}).catch(() => {});

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// 1. Security Headers via Helmet
app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: false
}));

// 2. Strict CORS Configuration
const configuredOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map(url => url.trim().replace(/\/+$/, ''))
  .filter(Boolean);

const defaultOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5175',
  'http://localhost:3000'
];

const allowedOrigins = Array.from(new Set([...configuredOrigins, ...defaultOrigins]));

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const cleanOrigin = origin.replace(/\/+$/, '');
    if (
      process.env.CLIENT_URL === '*' ||
      allowedOrigins.includes(cleanOrigin) ||
      (NODE_ENV !== 'production' && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(cleanOrigin))
    ) {
      callback(null, true);
    } else {
      callback(new Error(`Origin [${origin}] not allowed by CORS`));
    }
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-request', 'Cache-Control', 'Pragma']
}));

// 3. Request Body Parser with payload limit
app.use(express.json({ limit: '10mb' }));

// Static uploads directory for direct database & local media streaming
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
const videosDir = path.join(uploadsDir, 'videos');
if (!fs.existsSync(videosDir)) {
  fs.mkdirSync(videosDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// 4. NoSQL Query & Body Sanitization (blocks operator injection like $gt, $where)
app.use(mongoSanitize);

// 5. Rate Limiting Protection
// General API rate limiter (generous in development, 3,000 requests per 15 mins in prod)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: NODE_ENV === 'production' ? 3000 : 15000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting in development or for health checks
    if (NODE_ENV !== 'production') return true;
    if (req.path === '/health' || req.path === '/api/health' || req.path === '/') return true;
    return false;
  },
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

// Root & Health Checks for Cloud Run
app.get(['/health', '/api/health'], (req, res) => {
  res.status(200).json({
    status: 'healthy',
    environment: NODE_ENV,
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.status(200).json({
    status: 'online',
    service: 'The Sehat Buddy Backend API',
    environment: NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// Overall stats API
app.get('/api/stats', (req, res) => {
  res.json({ success: true, data: { status: "Please use admin/dashboard" } });
});

// Realtime Server-Sent Events stream for entire website, pages, and all dashboards
app.get('/api/realtime-stream', streamRealtimeDatabase);

// Dedicated Instagram Reel Cover & Media Proxy Endpoint
app.get('/api/reel-cover', async (req, res) => {
  try {
    const rawUrl = req.query.url;
    if (!rawUrl) {
      return res.status(404).send('URL is required');
    }

    let shortcode = rawUrl;
    const match = String(rawUrl).match(/instagram\.com\/(?:reel|reels|p|tv|share\/reel)\/([^/?#&]+)/i);
    if (match && match[1]) {
      shortcode = match[1];
    }
    shortcode = shortcode.replace(/[^a-zA-Z0-9_-]/g, '');

    const igRes = await fetch(`https://www.instagram.com/p/${shortcode}/media/?size=l`, {
      redirect: 'manual',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const location = igRes.headers.get('location');
    if (location && (igRes.status === 301 || igRes.status === 302)) {
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.redirect(location);
    }

    if (igRes.ok && igRes.headers.get('content-type')?.includes('image')) {
      const buffer = await igRes.arrayBuffer();
      res.setHeader('Content-Type', igRes.headers.get('content-type') || 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.send(Buffer.from(buffer));
    }

    return res.status(404).send('Cover image not found');
  } catch (err) {
    return res.status(404).send('Error fetching reel cover');
  }
});

// In-memory cache for direct extracted reel video streams (2 hour TTL)
const reelVideoCache = new Map();
const inFlightReelExtractions = new Map();

// Helper to stream range requests directly or redirect safely without losing HTTP range context
const streamOrRedirectVideo = async (targetVideoUrl, req, res) => {
  if (req.query.json === 'true') {
    return res.json({ success: true, videoUrl: targetVideoUrl });
  }

  const rangeHeader = req.headers.range;
  if (rangeHeader) {
    try {
      const upstream = await fetch(targetVideoUrl, {
        headers: {
          'Range': rangeHeader,
          'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        }
      });

      res.status(upstream.status);
      res.setHeader('Content-Type', upstream.headers.get('content-type') || 'video/mp4');
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=7200');

      const cr = upstream.headers.get('content-range');
      if (cr) res.setHeader('Content-Range', cr);
      const cl = upstream.headers.get('content-length');
      if (cl) res.setHeader('Content-Length', cl);

      const { Readable } = await import('stream');
      Readable.fromWeb(upstream.body).pipe(res);
      return;
    } catch (streamErr) {
      console.warn('Range streaming proxy fallback to 307:', streamErr.message);
    }
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=7200');
  return res.redirect(307, targetVideoUrl);
};

// Dedicated Instagram Reel Direct Video Extractor / Stream Endpoint
app.get('/api/reel-video', async (req, res) => {
  try {
    const rawUrl = req.query.url;
    if (!rawUrl) {
      return res.status(400).json({ success: false, message: 'URL is required' });
    }

    const cleanRaw = String(rawUrl).trim();

    // Direct Cloudinary or MP4/WebM/MOV videos stream directly
    if (
      cleanRaw.includes('cloudinary.com') ||
      /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(cleanRaw)
    ) {
      return streamOrRedirectVideo(cleanRaw, req, res);
    }

    // Extract clean canonical shortcode and URL (strips tracking & UTM query params)
    const shortcodeMatch = cleanRaw.match(/instagram\.com\/(?:reel|reels|p|tv|share\/reel)\/([^/?#&]+)/i);
    const shortcode = shortcodeMatch ? shortcodeMatch[1] : '';
    const cacheKey = shortcode || cleanRaw;
    const targetReelUrl = shortcode ? `https://www.instagram.com/reel/${shortcode}/` : cleanRaw;

    // Check in-memory cache first (instant response in <1ms)
    const cached = reelVideoCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now() && cached.videoUrl) {
      return streamOrRedirectVideo(cached.videoUrl, req, res);
    }

    // Deduplicate in-flight extraction requests to prevent CPU thrashing & multiple yt-dlp processes
    if (!inFlightReelExtractions.has(cacheKey)) {
      const extractionPromise = (async () => {
        try {
          const { exec } = await import('child_process');
          const { promisify } = await import('util');
          const execPromise = promisify(exec);

          // Fast direct commands with socket-timeout
          const commands = [
            `yt-dlp --no-warnings --no-check-certificates --socket-timeout 8 -g "${targetReelUrl}"`,
            `py -m yt_dlp --no-warnings --no-check-certificates --socket-timeout 8 -g "${targetReelUrl}"`
          ];

          for (const cmd of commands) {
            try {
              const { stdout } = await execPromise(cmd, { timeout: 12000 });
              const lines = stdout.trim().split('\n').map(s => s.trim()).filter(s => s.startsWith('http'));
              if (lines.length > 0) {
                const directMp4 = lines[0];
                reelVideoCache.set(cacheKey, {
                  videoUrl: directMp4,
                  expiresAt: Date.now() + 2 * 3600 * 1000 // 2 hours
                });
                return directMp4;
              }
            } catch (cmdErr) {
              // try next fallback command
            }
          }
        } catch (ytErr) {
          console.warn('Reel extraction warning:', ytErr.message);
        }
        return null;
      })().finally(() => {
        inFlightReelExtractions.delete(cacheKey);
      });

      inFlightReelExtractions.set(cacheKey, extractionPromise);
    }

    const directMp4 = await inFlightReelExtractions.get(cacheKey);

    if (directMp4 && directMp4.startsWith('http')) {
      return streamOrRedirectVideo(directMp4, req, res);
    }

    return res.status(404).json({
      success: false,
      message: 'Direct video stream unavailable',
      shortcode,
      embedUrl: shortcode ? `https://www.instagram.com/reel/${shortcode}/embed/` : null
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
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
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/avatars', avatarRoutes);

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
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🩺 The Sehat Buddy Backend API running in [${NODE_ENV}] mode at port ${PORT}`);
});

export default app;
