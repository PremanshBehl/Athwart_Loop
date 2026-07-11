import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import 'express-async-errors';

import authRoutes from './routes/auth.routes';
import postRoutes from './routes/post.routes';
import commentRoutes from './routes/comment.routes';
import notificationRoutes from './routes/notification.routes';
import archiveRoutes from './routes/archive.routes';
import userRoutes from './routes/user.routes';
import intelligenceRoutes from './routes/v1/intelligence.route';
import departmentRoutes from './routes/v1/department.route';
import adminRoutes from './routes/admin.routes';
import digestRoutes from './routes/digest.routes';
import campaignRoutes from './routes/campaign.routes';
import searchRoutes from './routes/search.routes';
import { errorHandler } from './middleware/error.middleware';
import { tracingMiddleware } from './middleware/tracing.middleware';
import { config } from './config/env.config';

const app = express();

// CORS: never mix wildcard '*' with credentials — that's an authorization leak.
// - Production: CORS_ORIGIN MUST be set to an explicit comma-separated allowlist.
// - Development: fall back to a small hardcoded list of localhost dev origins.
const devDefaultOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://localhost:5174',
  'http://localhost:5175',
];
const allowedOrigins = config.CORS_ORIGIN
  ? config.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean)
  : (config.NODE_ENV === 'production' ? [] : devDefaultOrigins);

if (config.NODE_ENV === 'production' && allowedOrigins.length === 0) {
  // Fail loud — a misconfigured prod deploy should not silently accept anyone.
  throw new Error('CORS_ORIGIN must be set in production');
}

app.use(tracingMiddleware());
app.use(cors({
  origin: (origin, cb) => {
    // Allow same-origin / server-to-server requests (no Origin header).
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files securely. Force download for anything but images so a
// crafted .html / .svg upload can't execute inline in another user's session.
const INLINEABLE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
app.use('/uploads', express.static(path.resolve(__dirname, '../../uploads'), {
  setHeaders: (res, filePath) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    const ext = path.extname(filePath).toLowerCase();
    if (!INLINEABLE_EXTS.has(ext)) {
      // basename is safe here — filePath comes from the filesystem resolver, not the URL.
      res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filePath)}"`);
    }
  }
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/archive', archiveRoutes);
app.use('/api/intelligence', intelligenceRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/digest', digestRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/search',    searchRoutes);

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// Global error handler (must be last)
app.use(errorHandler);

export default app;
