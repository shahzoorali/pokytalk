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

// Configure Socket.io with detailed logging
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

console.log('🔧 Socket.io configured with CORS origin:', process.env.FRONTEND_URL || "http://localhost:3000");

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
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

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Pokytalk backend server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
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
