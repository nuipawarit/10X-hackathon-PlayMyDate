import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { withAuth } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      const { searchParams } = new URL(request.url);
      const matchId = searchParams.get('matchId');
      const after = searchParams.get('after');
      const limit = searchParams.get('limit') || '50';

      if (!matchId) {
        return NextResponse.json({ error: 'Match ID is required' }, { status: 400 });
      }

      const matchResult = await sql`
        SELECT * FROM matches
        WHERE id = ${matchId}
          AND (user1_id = ${userId} OR user2_id = ${userId})
      `;

      if (matchResult.rows.length === 0) {
        return NextResponse.json({ error: 'Not authorized to view messages' }, { status: 403 });
      }

      let messagesResult;

      if (after) {
        messagesResult = await sql`
          SELECT m.*, u.display_name as sender_name
          FROM messages m
          JOIN users u ON m.sender_id = u.id
          WHERE m.match_id = ${matchId}
            AND m.created_at > (SELECT created_at FROM messages WHERE id = ${after})
          ORDER BY m.created_at ASC
          LIMIT ${parseInt(limit)}
        `;
      } else {
        messagesResult = await sql`
          SELECT m.*, u.display_name as sender_name
          FROM messages m
          JOIN users u ON m.sender_id = u.id
          WHERE m.match_id = ${matchId}
          ORDER BY m.created_at DESC
          LIMIT ${parseInt(limit)}
        `;
        messagesResult.rows.reverse();
      }

      return NextResponse.json({ messages: messagesResult.rows });
    } catch (error) {
      console.error('Get messages error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      const { matchId, content } = await request.json();

      if (!matchId || !content) {
        return NextResponse.json({ error: 'Match ID and content are required' }, { status: 400 });
      }

      const matchResult = await sql`
        SELECT * FROM matches
        WHERE id = ${matchId}
          AND (user1_id = ${userId} OR user2_id = ${userId})
          AND status = 'matched'
      `;

      if (matchResult.rows.length === 0) {
        return NextResponse.json({ error: 'Not authorized to send messages' }, { status: 403 });
      }

      const messageResult = await sql`
        INSERT INTO messages (match_id, sender_id, content)
        VALUES (${matchId}, ${userId}, ${content})
        RETURNING *
      `;

      const userResult = await sql`
        SELECT display_name FROM users WHERE id = ${userId}
      `;

      return NextResponse.json({
        message: {
          ...messageResult.rows[0],
          sender_name: userResult.rows[0]?.display_name,
        },
      }, { status: 201 });
    } catch (error) {
      console.error('Send message error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}
