import { sql } from '@/lib/db';
import type { User } from '@/lib/db';
import { success, failure, type ServiceResult } from './types';
import { getPersonaType, type PersonaType } from './behavioral';

export interface MatchWithPartner {
  id: string;
  compatibilityScore: number;
  status: string;
  createdAt: string;
  partner: SanitizedPartner;
}

export interface SanitizedPartner {
  id: string;
  display_name: string | null;
  playing_style: string[];
  interests: string[];
  bio: string | null;
}

export interface CreatedMatch {
  match: {
    id: string;
    user1_id: string;
    user2_id: string;
    compatibility_score: number;
    status: string;
  };
  partner: SanitizedPartner;
  compatibility_score: number;
}

export interface MatchingOptions {
  includeBehavioral?: boolean;
  locationBased?: boolean;
  maxDistance?: number;
  premiumPriority?: boolean;
  limit?: number;
}

const PERSONA_COMPATIBILITY: Record<PersonaType, PersonaType[]> = {
  explorer: ['explorer', 'connector', 'achiever'],
  connector: ['connector', 'explorer', 'casual'],
  achiever: ['achiever', 'explorer', 'premium'],
  premium: ['premium', 'achiever', 'connector'],
  casual: ['casual', 'connector', 'explorer'],
};

export function calculateCompatibility(user1: User, user2: User): number {
  const style1 = new Set(user1.playing_style || []);
  const style2 = new Set(user2.playing_style || []);
  const interests1 = new Set(user1.interests || []);
  const interests2 = new Set(user2.interests || []);

  const styleScore = jaccardSimilarity(style1, style2);
  const interestScore = jaccardSimilarity(interests1, interests2);

  const totalScore = (styleScore * 0.4 + interestScore * 0.6) * 100;
  return Math.round(totalScore * 100) / 100;
}

export async function calculateAdvancedCompatibility(
  user1: User,
  user2: User,
  user1Persona?: PersonaType,
  user2Persona?: PersonaType
): Promise<number> {
  const baseScore = calculateCompatibility(user1, user2);

  let personaBonus = 0;
  if (user1Persona && user2Persona) {
    const compatiblePersonas = PERSONA_COMPATIBILITY[user1Persona] || [];
    if (compatiblePersonas.includes(user2Persona)) {
      const index = compatiblePersonas.indexOf(user2Persona);
      personaBonus = (3 - index) * 5;
    }
  }

  const finalScore = Math.min(100, baseScore + personaBonus);
  return Math.round(finalScore * 100) / 100;
}

export function jaccardSimilarity(set1: Set<string>, set2: Set<string>): number {
  if (set1.size === 0 && set2.size === 0) return 0.5;

  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  return intersection.size / union.size;
}

export function sanitizePartner(user: User): SanitizedPartner {
  return {
    id: user.id,
    display_name: user.display_name,
    playing_style: user.playing_style || [],
    interests: user.interests || [],
    bio: user.bio,
  };
}

export async function findMatches(
  userId: string,
  options: MatchingOptions = {}
): Promise<ServiceResult<CreatedMatch[]>> {
  try {
    const {
      includeBehavioral = true,
      premiumPriority = false,
      limit = 20,
    } = options;

    const currentUserResult = await sql`
      SELECT u.*, ubp.persona_type
      FROM users u
      LEFT JOIN user_behavioral_profiles ubp ON u.id = ubp.user_id
      WHERE u.id = ${userId}
    `;

    if (currentUserResult.rows.length === 0) {
      return failure('Profile not found', 'NOT_FOUND');
    }

    const currentUser = currentUserResult.rows[0] as User & { persona_type?: string };
    const currentPersona = currentUser.persona_type as PersonaType | undefined;
    const isPremium = currentUser.subscription_tier === 'premium' || currentUser.subscription_tier === 'plus';

    const existingMatchesResult = await sql`
      SELECT user1_id, user2_id FROM matches
      WHERE user1_id = ${userId} OR user2_id = ${userId}
    `;

    const matchedUserIds = new Set<string>();
    matchedUserIds.add(userId);
    existingMatchesResult.rows.forEach((m) => {
      matchedUserIds.add(m.user1_id);
      matchedUserIds.add(m.user2_id);
    });

    const matchedIdsArray = Array.from(matchedUserIds);
    const effectiveLimit = isPremium || premiumPriority ? limit * 2 : limit;

    let potentialMatchesResult;
    if (premiumPriority && isPremium) {
      potentialMatchesResult = await sql`
        SELECT u.*, ubp.persona_type
        FROM users u
        LEFT JOIN user_behavioral_profiles ubp ON u.id = ubp.user_id
        WHERE u.id != ALL(${matchedIdsArray as unknown as string}::uuid[])
        ORDER BY
          CASE WHEN u.subscription_tier IN ('premium', 'plus') THEN 0 ELSE 1 END,
          u.created_at DESC
        LIMIT ${effectiveLimit}
      `;
    } else {
      potentialMatchesResult = await sql`
        SELECT u.*, ubp.persona_type
        FROM users u
        LEFT JOIN user_behavioral_profiles ubp ON u.id = ubp.user_id
        WHERE u.id != ALL(${matchedIdsArray as unknown as string}::uuid[])
        ORDER BY u.created_at DESC
        LIMIT ${effectiveLimit}
      `;
    }

    if (potentialMatchesResult.rows.length === 0) {
      return success([]);
    }

    const createdMatches: CreatedMatch[] = [];
    const scoredCandidates: Array<{ candidate: User & { persona_type?: string }; score: number }> = [];

    for (const candidate of potentialMatchesResult.rows as (User & { persona_type?: string })[]) {
      let score: number;

      if (includeBehavioral && currentPersona) {
        score = await calculateAdvancedCompatibility(
          currentUser,
          candidate,
          currentPersona,
          candidate.persona_type as PersonaType | undefined
        );
      } else {
        score = calculateCompatibility(currentUser, candidate);
      }

      if (score >= 30) {
        scoredCandidates.push({ candidate, score });
      }
    }

    scoredCandidates.sort((a, b) => b.score - a.score);

    const topCandidates = scoredCandidates.slice(0, limit);

    for (const { candidate, score } of topCandidates) {
      const [user1_id, user2_id] =
        currentUser.id < candidate.id
          ? [currentUser.id, candidate.id]
          : [candidate.id, currentUser.id];

      const matchResult = await sql`
        INSERT INTO matches (user1_id, user2_id, compatibility_score, status)
        VALUES (${user1_id}, ${user2_id}, ${score}, 'matched')
        ON CONFLICT (user1_id, user2_id) DO NOTHING
        RETURNING *
      `;

      if (matchResult.rows.length > 0) {
        const match = matchResult.rows[0] as {
          id: string;
          user1_id: string;
          user2_id: string;
          compatibility_score: number;
          status: string;
        };
        createdMatches.push({
          match,
          partner: sanitizePartner(candidate),
          compatibility_score: score,
        });
      }
    }

    return success(createdMatches);
  } catch (error) {
    console.error('findMatches error:', error);
    return failure('Failed to find matches', 'INTERNAL_ERROR');
  }
}

export async function unmatch(userId: string, matchId: string): Promise<ServiceResult<void>> {
  try {
    const result = await sql`
      UPDATE matches
      SET status = 'unmatched', updated_at = NOW()
      WHERE id = ${matchId}
        AND (user1_id = ${userId} OR user2_id = ${userId})
      RETURNING *
    `;

    if (result.rows.length === 0) {
      return failure('Match not found', 'NOT_FOUND');
    }

    return success(undefined);
  } catch (error) {
    console.error('unmatch error:', error);
    return failure('Failed to unmatch', 'INTERNAL_ERROR');
  }
}
