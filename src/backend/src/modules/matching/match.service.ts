import { AppError } from '../../shared/middleware/error.js';
import * as matchRepo from './match.repository.js';
import * as userRepo from '../user/user.repository.js';
import { User } from '../../shared/types/index.js';

export async function findMatches(userId: string) {
  const potentialMatches = await userRepo.findPotentialMatches(userId, 20);
  const currentUser = await userRepo.findUserById(userId);

  if (!currentUser) {
    throw new AppError('User not found', 404);
  }

  const matches = [];

  for (const candidate of potentialMatches) {
    const score = calculateCompatibility(currentUser, candidate);
    if (score >= 30) {
      const match = await matchRepo.createMatch(userId, candidate.id, score);
      await createIntimacyRecord(match.id);
      matches.push({
        match,
        partner: sanitizePartner(candidate),
        compatibility_score: score,
      });
    }
  }

  return matches;
}

export async function getMyMatches(userId: string) {
  return matchRepo.findMatchesWithPartners(userId);
}

export async function getMatchDetail(matchId: string, userId: string) {
  const result = await matchRepo.getMatchWithPartner(matchId, userId);

  if (!result) {
    throw new AppError('Match not found', 404);
  }

  if (result.match.user1_id !== userId && result.match.user2_id !== userId) {
    throw new AppError('Not authorized to view this match', 403);
  }

  return {
    match: result.match,
    partner: sanitizePartner(result.partner),
  };
}

export async function unmatch(matchId: string, userId: string) {
  const match = await matchRepo.findMatchById(matchId);

  if (!match) {
    throw new AppError('Match not found', 404);
  }

  if (match.user1_id !== userId && match.user2_id !== userId) {
    throw new AppError('Not authorized to unmatch', 403);
  }

  return matchRepo.updateMatchStatus(matchId, 'unmatched');
}

function calculateCompatibility(user1: User, user2: User): number {
  const style1 = new Set(user1.playing_style || []);
  const style2 = new Set(user2.playing_style || []);
  const interests1 = new Set(user1.interests || []);
  const interests2 = new Set(user2.interests || []);

  const styleScore = jaccardSimilarity(style1, style2);
  const interestScore = jaccardSimilarity(interests1, interests2);

  const totalScore = (styleScore * 0.4 + interestScore * 0.6) * 100;

  return Math.round(totalScore * 100) / 100;
}

function jaccardSimilarity(set1: Set<string>, set2: Set<string>): number {
  if (set1.size === 0 && set2.size === 0) return 0.5;

  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  return intersection.size / union.size;
}

function sanitizePartner(user: User) {
  return {
    id: user.id,
    display_name: user.display_name,
    playing_style: user.playing_style,
    interests: user.interests,
    bio: user.bio,
  };
}

async function createIntimacyRecord(matchId: string) {
  const { queryOne } = await import('../../shared/database/index.js');
  await queryOne(
    `INSERT INTO intimacy_scores (match_id, score, unlocks)
     VALUES ($1, 0, '[]')
     ON CONFLICT (match_id) DO NOTHING
     RETURNING *`,
    [matchId]
  );
}
