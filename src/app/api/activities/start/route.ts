import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { withAuth } from '@/lib/api-auth';

export async function POST(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      const { matchId, activityId } = await request.json();

      if (!matchId || !activityId) {
        return NextResponse.json({ error: 'Match ID and Activity ID are required' }, { status: 400 });
      }

      const matchResult = await sql`
        SELECT * FROM matches
        WHERE id = ${matchId}
          AND (user1_id = ${userId} OR user2_id = ${userId})
      `;

      if (matchResult.rows.length === 0) {
        return NextResponse.json({ error: 'Match not found' }, { status: 404 });
      }

      const activityResult = await sql`
        SELECT * FROM activities WHERE id = ${activityId}
      `;

      if (activityResult.rows.length === 0) {
        return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
      }

      const instanceResult = await sql`
        INSERT INTO activity_instances (match_id, activity_id, status, started_at)
        VALUES (${matchId}, ${activityId}, 'in_progress', NOW())
        RETURNING *
      `;

      return NextResponse.json({
        instance: instanceResult.rows[0],
        activity: activityResult.rows[0],
      }, { status: 201 });
    } catch (error) {
      console.error('Start activity error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}
