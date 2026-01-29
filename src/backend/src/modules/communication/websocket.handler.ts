import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../../shared/config/index.js';
import { JwtPayload } from '../../shared/types/index.js';
import * as messageService from './message.service.js';

interface AuthenticatedSocket extends Socket {
  user?: JwtPayload;
}

const userSockets = new Map<string, Set<string>>();

export function setupWebSocket(io: Server) {
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
      socket.user = decoded;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.user!.userId;
    console.log(`User ${userId} connected`);

    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId)!.add(socket.id);

    socket.on('join_match', (matchId: string) => {
      socket.join(`match:${matchId}`);
      console.log(`User ${userId} joined match:${matchId}`);
    });

    socket.on('leave_match', (matchId: string) => {
      socket.leave(`match:${matchId}`);
      console.log(`User ${userId} left match:${matchId}`);
    });

    socket.on('send_message', async (data: { matchId: string; content: string }) => {
      try {
        const message = await messageService.sendMessage(data.matchId, userId, data.content);

        io.to(`match:${data.matchId}`).emit('new_message', {
          message,
          sender_id: userId,
        });
      } catch (error: any) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('typing', (data: { matchId: string }) => {
      socket.to(`match:${data.matchId}`).emit('user_typing', {
        user_id: userId,
        match_id: data.matchId,
      });
    });

    socket.on('stop_typing', (data: { matchId: string }) => {
      socket.to(`match:${data.matchId}`).emit('user_stop_typing', {
        user_id: userId,
        match_id: data.matchId,
      });
    });

    socket.on('disconnect', () => {
      console.log(`User ${userId} disconnected`);
      userSockets.get(userId)?.delete(socket.id);
      if (userSockets.get(userId)?.size === 0) {
        userSockets.delete(userId);
      }
    });
  });
}

export function notifyUser(userId: string, event: string, data: any) {
  const socketIds = userSockets.get(userId);
  if (socketIds) {
    socketIds.forEach(socketId => {
      // This will be called from the io instance
    });
  }
}
