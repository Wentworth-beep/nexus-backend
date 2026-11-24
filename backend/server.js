const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const env = require('./config/environment');
const errorHandler = require('./middleware/errorHandler');
const prisma = require('./config/database');

const app = express();
app.set('trust proxy', 1);

// --- Security & Middleware ---
app.use(helmet({ contentSecurityPolicy: false }));

// Allow requests from localhost and ANY Vercel deployment
app.use(cors({ 
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // Allow Postman/curl
    if (origin.includes('localhost') || origin.includes('vercel.app')) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true 
}));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health',
  handler: (_req, res) =>
    res.status(429).json({
      error: 'Too many requests. Please wait before trying again.',
    }),
});
app.use('/api/', limiter);

// --- Static Files ---
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// --- API Routes ---
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/product')); 
app.use('/api/categories', require('./routes/categories'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/wishlist', require('./routes/wishlist'));
app.use('/api/coupons', require('./routes/coupons'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/messages', require('./routes/messages'));

// --- Health Check ---
app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, database: 'connected' });
  } catch (err) {
    res.status(503).json({ ok: false, database: 'unavailable' });
  }
});

// --- Error Handling ---
app.use(errorHandler);

// --- Start Server ---
app.listen(env.port, () => {
  console.log(`🚀 Server running on port ${env.port}`);
});
