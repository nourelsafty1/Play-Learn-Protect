// src/server.js

// Load environment variables
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// Import database connection
const connectDB = require('./config/database');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const childrenRoutes = require('./routes/children');
const gamesRoutes = require('./routes/games');
const learningRoutes = require('./routes/learning');
const progressRoutes = require('./routes/progress');
const monitoringRoutes = require('./routes/monitoring');
const safetyRoutes = require('./routes/safety');

// Initialize express app
const app = express();

// Connect to MongoDB
connectDB();

// ======================
// MIDDLEWARE
// ======================

// Body parser - parse JSON requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS (Cross-Origin Resource Sharing)
// This allows your frontend to communicate with the backend
app.use(cors({
  origin: process.env.FRONTEND_URL || '*', // Allow all origins in development
  credentials: true
}));

// Security headers
app.use(helmet());

// Logging in development mode
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev')); // Logs all requests: GET /api/users 200 15.123 ms
}

// Rate limiting - prevent spam/attacks
// More lenient in development, stricter in production
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // 1000 requests in dev, 100 in production
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/' || req.path === '/health';
  }
});

// Apply rate limiter to all API routes
app.use('/api/', limiter);

// ======================
// ROUTES
// ======================

// Health check route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Play, Learn & Protect API is running!',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/children', childrenRoutes);
app.use('/api/games', gamesRoutes);
app.use('/api/learning', learningRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/safety', safetyRoutes);

// 404 handler - Route not found
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// ======================
// ERROR HANDLER
// ======================

// Global error handler (must be last)
app.use(errorHandler);

// ======================
// START SERVER
// ======================

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log('=================================');
  console.log('🚀 Server Status');
  console.log('=================================');
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Server running on port: ${PORT}`);
  console.log(`Server URL: http://localhost:${PORT}`);
  console.log('=================================');
  console.log('📚 Available Routes:');
  console.log('=================================');
  console.log('Auth:       /api/auth');
  console.log('Children:   /api/children');
  console.log('Games:      /api/games');
  console.log('Learning:   /api/learning');
  console.log('Progress:   /api/progress');
  console.log('Monitoring: /api/monitoring');
  console.log('Safety:     /api/safety');
  console.log('=================================');
  console.log('✅ Server is ready to accept requests!');
  console.log('=================================\n');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`❌ Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Handle SIGTERM signal (graceful shutdown)
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('✅ HTTP server closed');
    mongoose.connection.close(false, () => {
      console.log('✅ MongoDB connection closed');
      process.exit(0);
    });
  });
});

// Handle Ctrl+C (graceful shutdown)
process.on('SIGINT', () => {
  console.log('\n👋 SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('✅ HTTP server closed');
    mongoose.connection.close(false, () => {
      console.log('✅ MongoDB connection closed');
      process.exit(0);
    });
  });
});

module.exports = app;