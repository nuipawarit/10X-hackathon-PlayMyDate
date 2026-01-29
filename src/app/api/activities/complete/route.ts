import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { withAuth } from '@/lib/api-auth';

export async function POST(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      const { instanceId, result } = await request.json();

      if (!instanceId) {
        return NextResponse.json({ error: 'Instance ID is required' }, { status: 400 });
      }

      const instanceResult = await sql`
        SELECT ai.*, a.intimacy_points
        FROM activity_instances ai
        JOIN activities a ON ai.activity_id = a.id
        WHERE ai.id = ${instanceId}
      `;

      if (instanceResult.rows.length === 0) {
        return NextResponse.json({ error: 'Activity instance not found' }, { status: 404 });
      }

      const instance = instanceResult.rows[0];

      const matchResult = await sql`
        SELECT * FROM matches
        WHERE id = ${instance.match_id}
          AND (user1_id = ${userId} OR user2_id = ${userId})
      `;

      if (matchResult.rows.length === 0) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
      }

      const completedInstanceResult = await sql`
        UPDATE activity_instances
        SET status = 'completed', result = ${JSON.stringify(result || {})}, completed_at = NOW()
        WHERE id = ${instanceId}
        RETURNING *
      `;

      await sql`
        UPDATE intimacy_scores
        SET score = score + ${instance.intimacy_points}
        WHERE match_id = ${instance.match_id}
      `;

      return NextResponse.json({ instance: completedInstanceResult.rows[0] });
    } catch (error) {
      console.error('Complete activity error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}
