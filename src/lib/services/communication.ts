import { sql, type Message, type TypingStatus } from '@/lib/db';
import { success, failure, type ServiceResult } from './types';

export async function getMessages(
  userId: string,
  matchId: string
): Promise<ServiceResult<Message[]>> {
  try {
    const matchResult = await sql`
      SELECT * FROM matches
      WHERE id = ${matchId}
        AND (user1_id = ${userId} OR user2_id = ${userId})
    `;

    if (matchResult.rows.length === 0) {
      return failure('Match not found', 'NOT_FOUND');
    }

    const result = await sql`
      SELECT * FROM messages
      WHERE match_id = ${matchId}
      ORDER BY created_at ASC
    `;

    return success(result.rows as Message[]);
  } catch (error) {
    console.error('getMessages error:', error);
    return failure('Failed to get messages', 'INTERNAL_ERROR');
  }
}

export async function sendMessage(
  userId: string,
  matchId: string,
  content: string
): Promise<ServiceResult<Message>> {
  try {
    const matchResult = await sql`
      SELECT * FROM matches
      WHERE id = ${matchId}
        AND (user1_id = ${userId} OR user2_id = ${userId})
        AND status = 'matched'
    `;

    if (matchResult.rows.length === 0) {
      return failure('Match not found or not active', 'NOT_FOUND');
    }

    const result = await sql`
      INSERT INTO messages (match_id, sender_id, content)
      VALUES (${matchId}, ${userId}, ${content})
      RETURNING *
    `;

    return success(result.rows[0] as Message);
  } catch (error) {
    console.error('sendMessage error:', error);
    return failure('Failed to send message', 'INTERNAL_ERROR');
  }
}

export async function markMessagesAsRead(
  userId: string,
  matchId: string
): Promise<ServiceResult<number>> {
  try {
    const result = await sql`
      UPDATE messages
      SET is_read = true
      WHERE match_id = ${matchId}
        AND sender_id != ${userId}
        AND is_read = false
    `;

    return success(result.rowCount || 0);
  } catch (error) {
    console.error('markMessagesAsRead error:', error);
    return failure('Failed to mark messages as read', 'INTERNAL_ERROR');
  }
}

export async function updateTypingStatus(
  userId: string,
  matchId: string,
  isTyping: boolean
): Promise<ServiceResult<TypingStatus>> {
  try {
    const matchResult = await sql`
      SELECT * FROM matches
      WHERE id = ${matchId}
        AND (user1_id = ${userId} OR user2_id = ${userId})
    `;

    if (matchResult.rows.length === 0) {
      return failure('Match not found', 'NOT_FOUND');
    }

    const result = await sql`
      INSERT INTO typing_status (match_id, user_id, is_typing, updated_at)
      VALUES (${matchId}, ${userId}, ${isTyping}, NOW())
      ON CONFLICT (match_id, user_id)
      DO UPDATE SET is_typing = ${isTyping}, updated_at = NOW()
      RETURNING *
    `;

    return success(result.rows[0] as TypingStatus);
  } catch (error) {
    console.error('updateTypingStatus error:', error);
    return failure('Failed to update typing status', 'INTERNAL_ERROR');
  }
}

export async function getTypingStatus(
  userId: string,
  matchId: string
): Promise<ServiceResult<TypingStatus | null>> {
  try {
    const matchResult = await sql`
      SELECT * FROM matches
      WHERE id = ${matchId}
        AND (user1_id = ${userId} OR user2_id = ${userId})
    `;

    if (matchResult.rows.length === 0) {
      return failure('Match not found', 'NOT_FOUND');
    }

    const match = matchResult.rows[0];
    const partnerId = match.user1_id === userId ? match.user2_id : match.user1_id;

    const result = await sql`
      SELECT * FROM typing_status
      WHERE match_id = ${matchId}
        AND user_id = ${partnerId}
    `;

    if (result.rows.length === 0) {
      return success(null);
    }

    return success(result.rows[0] as TypingStatus);
  } catch (error) {
    console.error('getTypingStatus error:', error);
    return failure('Failed to get typing status', 'INTERNAL_ERROR');
  }
}
