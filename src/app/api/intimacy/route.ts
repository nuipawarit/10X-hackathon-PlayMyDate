import { NextRequest, NextResponse } from 'next/server';
import { sql, INTIMACY_THRESHOLDS } from '@/lib/db';
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

      const intimacyResult = await sql`
        SELECT * FROM intimacy_scores WHERE match_id = ${matchId}
      `;

      if (intimacyResult.rows.length === 0) {
        return NextResponse.json({ error: 'Intimacy record not found' }, { status: 404 });
      }

      const intimacy = intimacyResult.rows[0];
      const availableUnlocks = getAvailableUnlocks(intimacy.score, intimacy.unlocks || []);

      return NextResponse.json({
        intimacy,
        available_unlocks: availableUnlocks,
        thresholds: INTIMACY_THRESHOLDS,
      });
    } catch (error) {
      console.error('Get intimacy error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}

function getAvailableUnlocks(score: number, currentUnlocks: string[]): string[] {
  const available: string[] = [];

  if (score >= INTIMACY_THRESHOLDS.real_name && !currentUnlocks.includes('real_name')) {
    available.push('real_name');
  }
  if (score >= INTIMACY_THRESHOLDS.photo && !currentUnlocks.includes('photo')) {
    available.push('photo');
  }
  if (score >= INTIMACY_THRESHOLDS.occupation && !currentUnlocks.includes('occupation')) {
    available.push('occupation');
  }
  if (score >= INTIMACY_THRESHOLDS.call && !currentUnlocks.includes('call')) {
    available.push('call');
  }

  return available;
}
