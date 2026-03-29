const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const hpp = require('hpp');

const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/auth');
const donationRoutes = require('./routes/donations');
const requestRoutes = require('./routes/requests');
const transactionRoutes = require('./routes/transactions');
const notificationRoutes = require('./routes/notifications');
const analyticsRoutes = require('./routes/analytics');
const userRoutes = require('./routes/users');

const app = express();

// 🛡️ 1. Security Headers (Helmet)
// Allowed crossOriginResourcePolicy as cross-origin to allow serving images locally
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// 🧪 2. Traffic Logging (Morgan)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// 🚦 3. Rate Limiting (Prevent DDoS/Brute Force)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased for development/testing
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes'
  }
});
app.use('/api', limiter);

// 🚀 4. Performance (Compression)
app.use(compression());

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🧹 5. Data Sanitization (NoSQL Injection & XSS)
// This MUST come after express.json() and express.urlencoded()
// Custom sanitization for Express 5 compatibility (avoids overwriting req.query)
const sanitizeObject = (obj) => {
  if (obj instanceof Object) {
    for (const key in obj) {
      if (/^\$/.test(key)) {
        delete obj[key];
      } else {
        sanitizeObject(obj[key]);
      }
    }
  }
  return obj;
};

app.use((req, res, next) => {
  if (req.body) sanitizeObject(req.body);
  if (req.params) sanitizeObject(req.params);
  if (req.query) sanitizeObject(req.query);
  next();
});

app.use(hpp()); // Prevent HTTP Parameter Pollution

// Connect to MongoDB
connectDB();

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/users', userRoutes);

// Root route for server identification
app.get('/', (req, res) => {
  res.send(`
    <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f4f7f6;">
      <div style="text-align: center; padding: 2rem; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <h1 style="color: #10b981; margin-bottom: 0.5rem;">🚚 FoodBridge API is LIVE</h1>
        <p style="color: #64748b;">The backend server is running correctly.</p>
        <a href="/api/health" style="color: #3b82f6; text-decoration: none; font-weight: 600;">Check API Health →</a>
      </div>
    </body>
  `);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'FoodBridge API is running',
    timestamp: new Date().toISOString()
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('SERVER ERROR 🔥:', err.message || err);
  if (err.stack) console.error('ERROR STACK 📜:', err.stack);
  
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    // 🛡️ Hide stack trace in production
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
  🚀 FoodBridge Server running on port ${PORT}
  📡 API: http://localhost:${PORT}/api
  🔑 Environment: ${process.env.NODE_ENV || 'development'}
  `);
});

module.exports = app;
