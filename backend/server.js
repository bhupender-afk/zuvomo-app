const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const { testConnection } = require('./config/database');

// Environment validation
const validateEnvironment = () => {
  const required = [
    'NODE_ENV', 'PORT', 'DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME',
    'JWT_SECRET', 'JWT_REFRESH_SECRET', 'FRONTEND_URL'
  ];

  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing);
    console.error('💡 Run "npm run validate:env" for detailed environment validation');
    process.exit(1);
  }

  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL}`);
  console.log(`🗄️  Database: ${process.env.DB_NAME} on ${process.env.DB_HOST}`);
  console.log(`🔐 JWT Expiry: ${process.env.JWT_EXPIRE}`);

  // OAuth configuration check
  const hasGoogleOAuth = process.env.GOOGLE_CLIENT_ID && !process.env.GOOGLE_CLIENT_ID.startsWith('your_');
  const hasLinkedInOAuth = process.env.LINKEDIN_CLIENT_ID && !process.env.LINKEDIN_CLIENT_ID.startsWith('your_');

  if (hasGoogleOAuth) {
    console.log(`✅ Google OAuth: Configured`);
  } else {
    console.log(`⚠️  Google OAuth: Not configured`);
  }

  if (hasLinkedInOAuth) {
    console.log(`✅ LinkedIn OAuth: Configured`);
  } else {
    console.log(`⚠️  LinkedIn OAuth: Not configured`);
  }
};

validateEnvironment();

// Import routes
const authRoutes = require('./routes/auth');
const authEnhancedRoutes = require('./routes/authEnhanced');
const enhancedAuthRoutes = require('./routes/enhanced-auth');
const adminRoutes = require('./routes/admin');
const projectRoutes = require('./routes/projects');
const investmentRoutes = require('./routes/investments');
const ratingsRoutes = require('./routes/ratings');
const watchlistRoutes = require('./routes/watchlist');
const blogsRoutes = require('./routes/blogs');
const caseStudiesRoutes = require('./routes/case-studies');

// Import middleware
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://accounts.google.com",
        "https://apis.google.com",
        "https://platform.linkedin.com",
        "https://www.linkedin.com"
      ],
      frameSrc: [
        "'self'",
        "https://accounts.google.com",
        "https://www.linkedin.com"
      ],
      connectSrc: [
        "'self'",
        "https://accounts.google.com",
        "https://www.googleapis.com",
        "https://api.linkedin.com",
        "https://www.linkedin.com"
      ],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3002',        // Vite dev server port
  'http://localhost:3003',        // Alternative Vite port
  'http://13.200.209.191:8080',   // Production server
  process.env.FRONTEND_URL        // Environment-specific URL
].filter(Boolean);

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    console.log(`🌐 CORS request from origin: ${origin}`);
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log(`✅ CORS allowed for origin: ${origin}`);
      callback(null, true);
    } else {
      console.log(`❌ CORS blocked request from origin: ${origin}`);
      console.log(`✅ Allowed origins:`, allowedOrigins);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Zuvomo Backend API'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/auth', enhancedAuthRoutes);
app.use('/api/auth-enhanced', authEnhancedRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/investments', investmentRoutes);
app.use('/api/ratings', ratingsRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/blogs', blogsRoutes);
app.use('/api/case-studies', caseStudiesRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      throw new Error('Database connection failed');
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Zuvomo Backend API Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 CORS enabled for: ${process.env.FRONTEND_URL || 'http://13.200.209.191:8080'}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

startServer();