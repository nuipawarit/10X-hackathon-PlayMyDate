import { NextRequest, NextResponse } from 'next/server';
import { sql, INTIMACY_THRESHOLDS } from '@/lib/db';
import { withAuth } from '@/lib/api-auth';

const VALID_UNLOCK_TYPES = ['real_name', 'photo', 'occupation', 'call'];

export async function POST(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      const { matchId, unlockType } = await request.json();

      if (!matchId || !unlockType) {
        return NextResponse.json({ error: 'Match ID and unlock type are required' }, { status: 400 });
      }

      if (!VALID_UNLOCK_TYPES.includes(unlockType)) {
        return NextResponse.json({ error: 'Invalid unlock type' }, { status: 400 });
      }

      const matchResult = await sql`
        SELECT * FROM matches
        WHERE id = ${matchId}
          AND (user1_id = ${userId} OR user2_id = ${userId})
      `;

      if (matchResult.rows.length === 0) {
        return NextResponse.json({ error: 'Match not found' }, { status: 404 });
      }

      const intimacyResult = await sql`
        SELECT * FROM intimacy_scores WHERE match_id = ${matchId}
      `;

      if (intimacyResult.rows.length === 0) {
        return NextResponse.json({ error: 'Intimacy record not found' }, { status: 404 });
      }

      const intimacy = intimacyResult.rows[0];
      const threshold = INTIMACY_THRESHOLDS[unlockType as keyof typeof INTIMACY_THRESHOLDS];

      if (intimacy.score < threshold) {
        return NextResponse.json({
          error: `Intimacy score too low. Need ${threshold}, have ${intimacy.score}`,
        }, { status: 400 });
      }

      const currentUnlocks = intimacy.unlocks || [];
      if (currentUnlocks.includes(unlockType)) {
        return NextResponse.json({ error: 'Already unlocked' }, { status: 400 });
      }

      const newUnlocks = [...currentUnlocks, unlockType];

      const updatedIntimacyResult = await sql`
        UPDATE intimacy_scores
        SET unlocks = ${JSON.stringify(newUnlocks)}
        WHERE match_id = ${matchId}
        RETURNING *
      `;

      const availableUnlocks = getAvailableUnlocks(updatedIntimacyResult.rows[0].score, newUnlocks);

      return NextResponse.json({
        intimacy: updatedIntimacyResult.rows[0],
        available_unlocks: availableUnlocks,
        thresholds: INTIMACY_THRESHOLDS,
      });
    } catch (error) {
      console.error('Unlock error:', error);
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
