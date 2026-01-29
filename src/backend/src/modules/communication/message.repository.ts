import { query, queryOne, execute } from '../../shared/database/index.js';
import { Message } from '../../shared/types/index.js';

export async function findByMatchId(
  matchId: string,
  limit: number = 50,
  offset: number = 0
): Promise<Message[]> {
  return query<Message>(
    `SELECT * FROM messages
     WHERE match_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [matchId, limit, offset]
  );
}

export async function findById(messageId: string): Promise<Message | null> {
  return queryOne<Message>('SELECT * FROM messages WHERE id = $1', [messageId]);
}

export async function create(
  matchId: string,
  senderId: string,
  content: string
): Promise<Message> {
  const result = await queryOne<Message>(
    `INSERT INTO messages (match_id, sender_id, content)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [matchId, senderId, content]
  );
  return result!;
}

export async function markAsRead(messageId: string): Promise<Message | null> {
  return queryOne<Message>(
    'UPDATE messages SET is_read = true WHERE id = $1 RETURNING *',
    [messageId]
  );
}

export async function markAllAsRead(matchId: string, userId: string): Promise<number> {
  return execute(
    `UPDATE messages SET is_read = true
     WHERE match_id = $1 AND sender_id != $2 AND is_read = false`,
    [matchId, userId]
  );
}

export async function getUnreadCount(matchId: string, userId: string): Promise<number> {
  const result = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM messages
     WHERE match_id = $1 AND sender_id != $2 AND is_read = false`,
    [matchId, userId]
  );
  return parseInt(result?.count || '0', 10);
}

export async function getMessageCount(matchId: string): Promise<number> {
  const result = await queryOne<{ count: string }>(
    'SELECT COUNT(*) as count FROM messages WHERE match_id = $1',
    [matchId]
  );
  return parseInt(result?.count || '0', 10);
}
