import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { SocketManager } from './socketManager';
import { UserManager } from './userManager';
import { CallManager } from './callManager';
import { StatsManager } from './statsManager';

dotenv.config();

// Enable debug logging (env-controlled only)
const DEBUG = process.env.DEBUG === 'true';

console.log('🚀 Starting Pokytalk backend server...');
console.log('📋 Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT || 3001,
  CORS_ORIGIN: process.env.CORS_ORIGIN || process.env.FRONTEND_URL || 'http://localhost:3000',
  DEBUG: DEBUG
});

const app = express();
const server = createServer(app);

// CORS origin configuration - allow localhost, local network IPs, and AWS Amplify domains
const isLocalNetworkOrigin = (origin: string | undefined): boolean => {
  if (!origin) return false;
  // Allow localhost and local network (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
  const localNetworkRegex = /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+)(:\d+)?$/;
  return localNetworkRegex.test(origin);
};

const isAmplifyDomain = (origin: string | undefined): boolean => {
  if (!origin) return false;
  // Allow AWS Amplify domains (amplifyapp.com) and App Runner domains
  return /^https?:\/\/.*\.amplifyapp\.com$/.test(origin) || 
         /^https?:\/\/.*\.amplify\.app$/.test(origin) ||
         /^https?:\/\/.*\.awsapprunner\.com$/.test(origin);
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
    // Allow if it matches frontend URL, local network, or Amplify/AppRunner domain
    const allowed = 
      (frontendUrl && origin === frontendUrl) ||
      isLocalNetworkOrigin(origin) || 
      isAmplifyDomain(origin);
    
    console.log(`🔍 CORS check for origin: ${origin} - ${allowed ? 'ALLOWED' : 'BLOCKED'}`);
    callback(null, allowed);
  };
};

const corsOrigin = getCorsOrigin();
console.log('🔧 Socket.io configured with CORS origin:', process.env.FRONTEND_URL || 'local network + AWS Amplify domains');

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
const socketManager = new SocketManager(io, userManager, callManager, statsManager);
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
  console.log(`🚀 Pokytalk backend server running on ${HOST}:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
  console.log('✅ Server startup completed');
  console.log('🌐 Accessible from network devices!');
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
