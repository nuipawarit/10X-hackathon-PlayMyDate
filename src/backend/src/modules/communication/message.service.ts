import { AppError } from '../../shared/middleware/error.js';
import * as messageRepo from './message.repository.js';
import * as matchRepo from '../matching/match.repository.js';
import * as intimacyService from '../intimacy/intimacy.service.js';

export async function getMessages(
  matchId: string,
  userId: string,
  limit: number = 50,
  offset: number = 0
) {
  const match = await matchRepo.findMatchById(matchId);
  if (!match) {
    throw new AppError('Match not found', 404);
  }

  if (match.user1_id !== userId && match.user2_id !== userId) {
    throw new AppError('Not authorized', 403);
  }

  const messages = await messageRepo.findByMatchId(matchId, limit, offset);
  const unreadCount = await messageRepo.getUnreadCount(matchId, userId);

  return {
    messages: messages.reverse(),
    unread_count: unreadCount,
    pagination: {
      limit,
      offset,
    },
  };
}

export async function sendMessage(matchId: string, senderId: string, content: string) {
  const match = await matchRepo.findMatchById(matchId);
  if (!match) {
    throw new AppError('Match not found', 404);
  }

  if (match.user1_id !== senderId && match.user2_id !== senderId) {
    throw new AppError('Not authorized', 403);
  }

  if (match.status !== 'matched') {
    throw new AppError('Cannot send messages to unmatched users', 400);
  }

  const message = await messageRepo.create(matchId, senderId, content);

  await intimacyService.addMessagePoint(matchId);

  return message;
}

export async function markAsRead(messageId: string, userId: string) {
  const message = await messageRepo.findById(messageId);
  if (!message) {
    throw new AppError('Message not found', 404);
  }

  const match = await matchRepo.findMatchById(message.match_id);
  if (!match) {
    throw new AppError('Match not found', 404);
  }

  if (match.user1_id !== userId && match.user2_id !== userId) {
    throw new AppError('Not authorized', 403);
  }

  return messageRepo.markAsRead(messageId);
}

export async function markAllAsRead(matchId: string, userId: string) {
  const match = await matchRepo.findMatchById(matchId);
  if (!match) {
    throw new AppError('Match not found', 404);
  }

  if (match.user1_id !== userId && match.user2_id !== userId) {
    throw new AppError('Not authorized', 403);
  }

  const count = await messageRepo.markAllAsRead(matchId, userId);
  return { marked_count: count };
}
