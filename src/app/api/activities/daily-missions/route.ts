import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';
import { sql, type Activity, type ActivityInstance } from '@/lib/db';

const MISSIONS_PER_DAY = 3;

function getDailyMissionSeed(matchId: string, date: Date): number {
  const dateStr = date.toISOString().split('T')[0];
  let hash = 0;
  const str = `${matchId}-${dateStr}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function selectDailyMissions(activities: Activity[], seed: number, count: number): Activity[] {
  const shuffled = [...activities];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = (seed + i) % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

export async function GET(request: NextRequest) {
  return withAuth(request, async (userId) => {
    const { searchParams } = new URL(request.url);
    const matchId = searchParams.get('matchId');

    if (!matchId) {
      return NextResponse.json({ error: 'matchId is required' }, { status: 400 });
    }

    try {
      const matchResult = await sql`
        SELECT * FROM matches
        WHERE id = ${matchId}
          AND (user1_id = ${userId} OR user2_id = ${userId})
          AND status = 'matched'
      `;

      if (matchResult.rows.length === 0) {
        return NextResponse.json({ error: 'Match not found' }, { status: 404 });
      }

      const activitiesResult = await sql`
        SELECT * FROM activities WHERE is_branded = false OR is_branded IS NULL
        ORDER BY name ASC
      `;

      const activities = activitiesResult.rows as Activity[];
      const today = new Date();
      const seed = getDailyMissionSeed(matchId, today);
      const dailyMissions = selectDailyMissions(activities, seed, MISSIONS_PER_DAY);

      const todayStart = new Date(today.toISOString().split('T')[0]);
      const todayEnd = new Date(todayStart);
      todayEnd.setDate(todayEnd.getDate() + 1);

      const completedResult = await sql`
        SELECT ai.activity_id
        FROM activity_instances ai
        WHERE ai.match_id = ${matchId}
          AND ai.status = 'completed'
          AND ai.completed_at >= ${todayStart.toISOString()}
          AND ai.completed_at < ${todayEnd.toISOString()}
      `;

      const completedActivityIds = new Set(
        completedResult.rows.map((r) => r.activity_id)
      );

      const inProgressResult = await sql`
        SELECT ai.*
        FROM activity_instances ai
        WHERE ai.match_id = ${matchId}
          AND ai.status = 'in_progress'
      `;

      const inProgressMap = new Map<string, ActivityInstance>();
      for (const row of inProgressResult.rows) {
        inProgressMap.set(row.activity_id as string, row as ActivityInstance);
      }

      const missionsWithStatus = dailyMissions.map((mission) => ({
        ...mission,
        isCompleted: completedActivityIds.has(mission.id),
        isInProgress: inProgressMap.has(mission.id),
        instanceId: inProgressMap.get(mission.id)?.id || null,
      }));

      const completedCount = missionsWithStatus.filter((m) => m.isCompleted).length;

      return NextResponse.json({
        missions: missionsWithStatus,
        completedCount,
        totalMissions: MISSIONS_PER_DAY,
        allCompleted: completedCount === MISSIONS_PER_DAY,
        date: today.toISOString().split('T')[0],
      });
    } catch (error) {
      console.error('Get daily missions error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}
