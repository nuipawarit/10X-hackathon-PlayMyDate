import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { config } from '../shared/config/index.js';
import { testConnection } from '../shared/database/index.js';
import { errorHandler, notFoundHandler } from '../shared/middleware/error.js';

// Import routes
import { authRouter } from '../modules/user/auth.router.js';
import { userRouter } from '../modules/user/user.router.js';
import { matchRouter } from '../modules/matching/match.router.js';
import { activityRouter } from '../modules/activity/activity.router.js';
import { intimacyRouter } from '../modules/intimacy/intimacy.router.js';
import { messageRouter } from '../modules/communication/message.router.js';
import { setupWebSocket } from '../modules/communication/websocket.handler.js';

const app = express();
const httpServer = createServer(app);

// Setup Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: config.frontend.url,
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors({
  origin: config.frontend.url,
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/matches', matchRouter);
app.use('/api/v1/activities', activityRouter);
app.use('/api/v1/intimacy', intimacyRouter);
app.use('/api/v1/messages', messageRouter);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Setup WebSocket
setupWebSocket(io);

// Export io for use in other modules
export { io };

// Start server
async function start() {
  const dbConnected = await testConnection();
  if (!dbConnected) {
    console.error('Failed to connect to database. Exiting...');
    process.exit(1);
  }

  httpServer.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
    console.log(`Environment: ${config.nodeEnv}`);
  });
}

start();
