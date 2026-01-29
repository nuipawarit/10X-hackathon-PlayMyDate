import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { withAuth } from '@/lib/api-auth';

export async function POST(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      const { matchId } = await request.json();

      if (!matchId) {
        return NextResponse.json({ error: 'Match ID is required' }, { status: 400 });
      }

      const matchResult = await sql`
        SELECT * FROM matches WHERE id = ${matchId}
      `;

      if (matchResult.rows.length === 0) {
        return NextResponse.json({ error: 'Match not found' }, { status: 404 });
      }

      const match = matchResult.rows[0];

      if (match.user1_id !== userId && match.user2_id !== userId) {
        return NextResponse.json({ error: 'Not authorized to unmatch' }, { status: 403 });
      }

      const updatedMatchResult = await sql`
        UPDATE matches
        SET status = 'unmatched', updated_at = NOW()
        WHERE id = ${matchId}
        RETURNING *
      `;

      return NextResponse.json({ match: updatedMatchResult.rows[0] });
    } catch (error) {
      console.error('Unmatch error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}
