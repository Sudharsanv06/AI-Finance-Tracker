import dotenv from 'dotenv';
dotenv.config();

import express       from 'express';
import cors          from 'cors';
import helmet        from 'helmet';
import rateLimit     from 'express-rate-limit';
import './config/firebase.js';

import authRoutes    from './routes/authRoutes.js';
import eventRoutes   from './routes/eventRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import aiRoutes      from './routes/aiRoutes.js';
import errorHandler  from './middleware/errorHandler.js';
import mongoSanitize from 'express-mongo-sanitize';
import xss           from 'xss-clean';
import incomeRoutes from './routes/incomeRoutes.js';
import familyRoutes from './routes/familyRoutes.js';
import investmentRoutes from './routes/investmentRoutes.js';
import loanRoutes from './routes/loanRoutes.js';
import budgetRoutes from './routes/budgetRoutes.js';
import goalRoutes   from './routes/goalRoutes.js';
import billRoutes   from './routes/billRoutes.js';

import { protect }     from './middleware/authMiddleware.js';
import { initRecurringIncomeScheduler } from './services/recurringIncomeScheduler.js';

const app  = express();
const PORT = process.env.PORT || 5000;

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[API LOG] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// ── Body Parser FIRST ─────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Data Sanitization against NoSQL injection & XSS ───────────────────────────
app.use(mongoSanitize());
app.use(xss());

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet());

const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:8081',
  'http://localhost:19006',
  'https://ai-finance-tracker-alpha-lilac.vercel.app',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow mobile apps (no origin header), Postman, or specified origins
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    return callback(null, true); // Permissive for mobile API access
  },
  credentials: true,
}));

// ── Rate Limiting ─────────────────────────────────────────────────────────────
const authRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max:      500,
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
  message:  { success: false, message: 'Too many requests, please try again later' },
});

const publicRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max:      500,
  message:  { success: false, message: 'Too many requests, please try again later' },
});

// Apply rate limiter to public endpoints
app.use('/api/auth/login', publicRateLimiter);
app.use('/api/auth/register', publicRateLimiter);

// Authenticate and rate limit other /api routes
app.use('/api', (req, res, next) => {
  const path = req.originalUrl.split('?')[0];
  if (
    path === '/api/auth/login' ||
    path === '/api/auth/register' ||
    path === '/api/health'
  ) {
    return next();
  }
  protect(req, res, (err) => {
    if (err) return next(err);
    authRateLimiter(req, res, next);
  });
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/events',   eventRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/ai',       aiRoutes);
app.use('/api/income', incomeRoutes);
app.use('/api/family', familyRoutes);
app.use('/api/investments', investmentRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/goals',   goalRoutes);
app.use('/api/bills',   billRoutes)

// ── Health Check ──────────────────────────────────────────────────────────────
app.get(['/api/health', '/healthz', '/health'], (req, res) => {
  res.json({
    success:     true,
    message:     '🚀 Paisa Pulse API is running',
    environment: process.env.NODE_ENV,
    timestamp:   new Date().toISOString(),
  });
});

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// ── Error Handler ─────────────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV}`);
  initRecurringIncomeScheduler();
});