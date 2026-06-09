import dotenv from 'dotenv';
dotenv.config();

import express       from 'express';
import cors          from 'cors';
import helmet        from 'helmet';
import rateLimit     from 'express-rate-limit';
import connectDB     from './config/db.js';
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

connectDB();

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Body Parser FIRST ─────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Data Sanitization against NoSQL injection & XSS ───────────────────────────
app.use(mongoSanitize());
app.use(xss());

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin:      process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// ── Rate Limiting ─────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      100,
  message:  { success: false, message: 'Too many requests, please try again later' },
});
app.use('/api', limiter);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/events',   eventRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/ai',       aiRoutes);
app.use('/api/income', incomeRoutes);
app.use('/api/family', familyRoutes);
app.use('/api/investments', investmentRoutes);
app.use('/api/loans', loanRoutes);

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success:     true,
    message:     '🚀 EventFi API is running',
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
});