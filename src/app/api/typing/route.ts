import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { withAuth } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      const { searchParams } = new URL(request.url);
      const matchId = searchParams.get('matchId');

      if (!matchId) {
        return NextResponse.json({ error: 'Match ID is required' }, { status: 400 });
      }

      const matchResult = await sql`
        SELECT * FROM matches
        WHERE id = ${matchId}
          AND (user1_id = ${userId} OR user2_id = ${userId})
      `;

      if (matchResult.rows.length === 0) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
      }

      const match = matchResult.rows[0];
      const partnerId = match.user1_id === userId ? match.user2_id : match.user1_id;

      const typingResult = await sql`
        SELECT is_typing, updated_at FROM typing_status
        WHERE match_id = ${matchId} AND user_id = ${partnerId}
      `;

      if (typingResult.rows.length === 0) {
        return NextResponse.json({ isTyping: false });
      }

      const typingStatus = typingResult.rows[0];
      const isRecent = new Date().getTime() - new Date(typingStatus.updated_at).getTime() < 5000;

      return NextResponse.json({
        isTyping: typingStatus.is_typing && isRecent,
      });
    } catch (error) {
      console.error('Get typing status error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      const { matchId, isTyping } = await request.json();

      if (!matchId) {
        return NextResponse.json({ error: 'Match ID is required' }, { status: 400 });
      }

      const matchResult = await sql`
        SELECT * FROM matches
        WHERE id = ${matchId}
          AND (user1_id = ${userId} OR user2_id = ${userId})
      `;

      if (matchResult.rows.length === 0) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
      }

      await sql`
        INSERT INTO typing_status (match_id, user_id, is_typing, updated_at)
        VALUES (${matchId}, ${userId}, ${isTyping ?? true}, NOW())
        ON CONFLICT (match_id, user_id)
        DO UPDATE SET is_typing = ${isTyping ?? true}, updated_at = NOW()
      `;

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Update typing status error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}
