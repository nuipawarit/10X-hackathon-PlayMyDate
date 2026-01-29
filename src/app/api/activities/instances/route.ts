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
        return NextResponse.json({ error: 'Not authorized to view this match' }, { status: 403 });
      }

      const instancesResult = await sql`
        SELECT ai.*, a.name as activity_name, a.type as activity_type,
               a.description as activity_description, a.intimacy_points
        FROM activity_instances ai
        JOIN activities a ON ai.activity_id = a.id
        WHERE ai.match_id = ${matchId}
        ORDER BY ai.created_at DESC
      `;

      return NextResponse.json({ instances: instancesResult.rows });
    } catch (error) {
      console.error('Get activity instances error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}
