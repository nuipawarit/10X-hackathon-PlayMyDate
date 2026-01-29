import { query, queryOne, execute } from '../../shared/database/index.js';
import { IntimacyScore } from '../../shared/types/index.js';

export async function findByMatchId(matchId: string): Promise<IntimacyScore | null> {
  return queryOne<IntimacyScore>(
    'SELECT * FROM intimacy_scores WHERE match_id = $1',
    [matchId]
  );
}

export async function createOrUpdate(
  matchId: string,
  score: number,
  unlocks: string[]
): Promise<IntimacyScore> {
  const result = await queryOne<IntimacyScore>(
    `INSERT INTO intimacy_scores (match_id, score, unlocks)
     VALUES ($1, $2, $3)
     ON CONFLICT (match_id)
     DO UPDATE SET score = $2, unlocks = $3
     RETURNING *`,
    [matchId, score, JSON.stringify(unlocks)]
  );
  return result!;
}

export async function updateScore(matchId: string, score: number): Promise<IntimacyScore | null> {
  return queryOne<IntimacyScore>(
    'UPDATE intimacy_scores SET score = $1 WHERE match_id = $2 RETURNING *',
    [score, matchId]
  );
}

export async function addUnlock(matchId: string, unlockType: string): Promise<IntimacyScore | null> {
  return queryOne<IntimacyScore>(
    `UPDATE intimacy_scores
     SET unlocks = unlocks || $1::jsonb
     WHERE match_id = $2
     AND NOT unlocks @> $1::jsonb
     RETURNING *`,
    [JSON.stringify([unlockType]), matchId]
  );
}

export async function addPoints(matchId: string, points: number): Promise<IntimacyScore | null> {
  return queryOne<IntimacyScore>(
    `UPDATE intimacy_scores
     SET score = LEAST(100, score + $1)
     WHERE match_id = $2
     RETURNING *`,
    [points, matchId]
  );
}
