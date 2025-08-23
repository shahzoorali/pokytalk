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

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json());

// Initialize managers
const userManager = new UserManager();
const callManager = new CallManager();
const statsManager = new StatsManager();
const socketManager = new SocketManager(io, userManager, callManager, statsManager);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    stats: statsManager.getStats()
  });
});

// Get user's country by IP
app.get('/api/location', async (req, res) => {
  try {
    const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
    const country = await userManager.getCountryByIP(ip);
    res.json({ country });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get location' });
  }
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Pokytalk backend server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});
