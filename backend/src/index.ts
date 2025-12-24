import express from 'express';
import { createServer } from 'http';
import { createServer as createHttpsServer } from 'https';
import { readFileSync } from 'fs';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { SocketManager } from './socketManager';
import { UserManager } from './userManager';
import { CallManager } from './callManager';
import { StatsManager } from './statsManager';
import { GameManager } from './gameManager';

dotenv.config();

// Enable debug logging (env-controlled only)
const DEBUG = process.env.DEBUG === 'true';

console.log('🚀 Starting Pokytalk backend server...');
console.log('📋 Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT || 3001,
  CORS_ORIGIN: process.env.CORS_ORIGIN || process.env.FRONTEND_URL || 'https://app.pokytalk.com',
  DEBUG: DEBUG
});

const app = express();

// HTTPS support - conditionally enabled via environment variable
const USE_HTTPS = process.env.USE_HTTPS === 'true';
let server;

if (USE_HTTPS) {
  const path = require('path');
  const keyPath = process.env.SSL_KEY_PATH || path.join(__dirname, '../../certs/key.pem');
  const certPath = process.env.SSL_CERT_PATH || path.join(__dirname, '../../certs/cert.pem');
  
  try {
    const key = readFileSync(keyPath);
    const cert = readFileSync(certPath);
    server = createHttpsServer({ key, cert }, app);
    console.log('🔒 HTTPS enabled');
    console.log(`   Key: ${keyPath}`);
    console.log(`   Cert: ${certPath}`);
  } catch (error) {
    console.error('❌ Failed to load SSL certificates:', error);
    console.error('   Falling back to HTTP');
    server = createServer(app);
  }
} else {
  server = createServer(app);
  console.log('🌐 HTTP mode (HTTPS disabled)');
}

// CORS origin configuration - allow production domains and AWS Amplify domains
const isAmplifyDomain = (origin: string | undefined): boolean => {
  if (!origin) return false;
  // Allow AWS Amplify domains (amplifyapp.com) and App Runner domains
  return /^https?:\/\/.*\.amplifyapp\.com$/.test(origin) || 
         /^https?:\/\/.*\.amplify\.app$/.test(origin) ||
         /^https?:\/\/.*\.awsapprunner\.com$/.test(origin);
};

const isCustomDomain = (origin: string | undefined): boolean => {
  if (!origin) return false;
  // Allow custom domains: pokytalk.com, www.pokytalk.com, and app.pokytalk.com
  return /^https?:\/\/(www\.)?pokytalk\.com$/.test(origin) ||
         /^https?:\/\/app\.pokytalk\.com$/.test(origin);
};

const getCorsOrigin = () => {
  const frontendUrl = process.env.FRONTEND_URL;
  // Return a function that works with both Socket.io and Express CORS
  return (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) {
      callback(null, true);
      return;
    }
    // Allow if it matches frontend URL, Amplify/AppRunner domain, or custom domain
    const allowed = 
      (frontendUrl && origin === frontendUrl) ||
      isAmplifyDomain(origin) ||
      isCustomDomain(origin);
    
    console.log(`🔍 CORS check for origin: ${origin} - ${allowed ? 'ALLOWED' : 'BLOCKED'}`);
    callback(null, allowed);
  };
};

const corsOrigin = getCorsOrigin();
console.log('🔧 Socket.io configured with CORS origin:', process.env.FRONTEND_URL || 'production domains + AWS Amplify');

// Configure Socket.io with detailed logging
const io = new Server(server, {
  cors: {
    origin: corsOrigin,
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['polling', 'websocket'],  // Polling first for better compatibility
  allowEIO3: true,
  pingTimeout: 60000,  // 60 seconds
  pingInterval: 25000,  // 25 seconds - keeps connection alive through load balancers
  upgradeTimeout: 30000,  // 30 seconds for upgrade
  maxHttpBufferSize: 1e6,  // 1MB
});

// Middleware
// Configure helmet with relaxed settings for WebSocket support
app.use(helmet({
  contentSecurityPolicy: false,  // Disable CSP for WebSocket compatibility
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: false,
}));
app.use(compression());
app.use(cors({
  origin: corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));
app.use(express.json());

console.log('✅ Middleware configured');

// Initialize managers
console.log('🔧 Initializing managers...');
const userManager = new UserManager();
const callManager = new CallManager();
const statsManager = new StatsManager();
const gameManager = new GameManager();
const socketManager = new SocketManager(io, userManager, callManager, statsManager, gameManager);
console.log('✅ Managers initialized');

// Root route for basic connectivity check
app.get('/', (req, res) => {
  res.json({ 
    service: 'pokytalk-backend',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  const stats = statsManager.getStats();
  console.log('🏥 Health check request from:', req.ip || req.connection.remoteAddress);
  console.log('📊 Current stats:', stats);
  
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    stats: stats,
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Express error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  console.log('❌ 404 Not Found:', req.method, req.originalUrl);
  res.status(404).json({ error: 'Not found' });
});

const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0'; // Listen on all interfaces for network access

server.listen(PORT, HOST, () => {
  const protocol = USE_HTTPS ? 'https' : 'http';
  const wsProtocol = USE_HTTPS ? 'wss' : 'ws';
  console.log(`🚀 Pokytalk backend server running on ${HOST}:${PORT}`);
  console.log(`📊 Health check: ${protocol}://${HOST}:${PORT}/health`);
  console.log(`🔌 WebSocket: ${wsProtocol}://${HOST}:${PORT}`);
  console.log('✅ Server startup completed');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Unhandled error handling
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
