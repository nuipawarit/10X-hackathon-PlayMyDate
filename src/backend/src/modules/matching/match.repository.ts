import { query, queryOne, execute } from '../../shared/database/index.js';
import { Match, User } from '../../shared/types/index.js';

export async function createMatch(
  user1Id: string,
  user2Id: string,
  compatibilityScore: number
): Promise<Match> {
  const [smallerId, largerId] = user1Id < user2Id ? [user1Id, user2Id] : [user2Id, user1Id];

  const result = await queryOne<Match>(
    `INSERT INTO matches (user1_id, user2_id, compatibility_score)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [smallerId, largerId, compatibilityScore]
  );
  return result!;
}

export async function findMatchById(matchId: string): Promise<Match | null> {
  return queryOne<Match>('SELECT * FROM matches WHERE id = $1', [matchId]);
}

export async function findMatchByUsers(user1Id: string, user2Id: string): Promise<Match | null> {
  const [smallerId, largerId] = user1Id < user2Id ? [user1Id, user2Id] : [user2Id, user1Id];
  return queryOne<Match>(
    'SELECT * FROM matches WHERE user1_id = $1 AND user2_id = $2',
    [smallerId, largerId]
  );
}

export async function findMatchesByUser(userId: string): Promise<Match[]> {
  return query<Match>(
    `SELECT * FROM matches
     WHERE (user1_id = $1 OR user2_id = $1)
     AND status = 'matched'
     ORDER BY created_at DESC`,
    [userId]
  );
}

export async function updateMatchStatus(matchId: string, status: string): Promise<Match | null> {
  return queryOne<Match>(
    'UPDATE matches SET status = $1 WHERE id = $2 RETURNING *',
    [status, matchId]
  );
}

export async function getMatchWithPartner(matchId: string, currentUserId: string): Promise<{
  match: Match;
  partner: User;
} | null> {
  const result = await queryOne<Match & { partner_id: string }>(
    `SELECT m.*,
     CASE WHEN m.user1_id = $2 THEN m.user2_id ELSE m.user1_id END as partner_id
     FROM matches m
     WHERE m.id = $1`,
    [matchId, currentUserId]
  );

  if (!result) return null;

  const partner = await queryOne<User>(
    'SELECT * FROM users WHERE id = $1',
    [result.partner_id]
  );

  if (!partner) return null;

  return {
    match: result,
    partner,
  };
}

export async function findMatchesWithPartners(userId: string): Promise<Array<{
  match: Match;
  partner: {
    id: string;
    display_name: string | null;
    playing_style: string[];
    interests: string[];
    bio: string | null;
  };
}>> {
  const results = await query<Match & {
    partner_id: string;
    partner_display_name: string | null;
    partner_playing_style: string[];
    partner_interests: string[];
    partner_bio: string | null;
  }>(
    `SELECT m.*,
     CASE WHEN m.user1_id = $1 THEN m.user2_id ELSE m.user1_id END as partner_id,
     u.display_name as partner_display_name,
     u.playing_style as partner_playing_style,
     u.interests as partner_interests,
     u.bio as partner_bio
     FROM matches m
     JOIN users u ON u.id = CASE WHEN m.user1_id = $1 THEN m.user2_id ELSE m.user1_id END
     WHERE (m.user1_id = $1 OR m.user2_id = $1)
     AND m.status = 'matched'
     ORDER BY m.created_at DESC`,
    [userId]
  );

  return results.map(r => ({
    match: {
      id: r.id,
      user1_id: r.user1_id,
      user2_id: r.user2_id,
      compatibility_score: r.compatibility_score,
      status: r.status as 'matched' | 'unmatched' | 'blocked',
      created_at: r.created_at,
      updated_at: r.updated_at,
    },
    partner: {
      id: r.partner_id,
      display_name: r.partner_display_name,
      playing_style: r.partner_playing_style,
      interests: r.partner_interests,
      bio: r.partner_bio,
    },
  }));
}
