import { config } from '../../shared/config/index.js';
import { AppError } from '../../shared/middleware/error.js';
import * as intimacyRepo from './intimacy.repository.js';
import * as matchRepo from '../matching/match.repository.js';

const UNLOCK_TYPES = {
  real_name: 'real_name',
  photo: 'photo',
  occupation: 'occupation',
  call: 'call',
} as const;

export async function getIntimacy(matchId: string, userId: string) {
  const match = await matchRepo.findMatchById(matchId);
  if (!match) {
    throw new AppError('Match not found', 404);
  }

  if (match.user1_id !== userId && match.user2_id !== userId) {
    throw new AppError('Not authorized', 403);
  }

  let intimacy = await intimacyRepo.findByMatchId(matchId);

  if (!intimacy) {
    intimacy = await intimacyRepo.createOrUpdate(matchId, 0, []);
  }

  const level = getLevel(intimacy.score);
  const availableUnlocks = getAvailableUnlocks(intimacy.score, intimacy.unlocks);

  return {
    ...intimacy,
    level,
    available_unlocks: availableUnlocks,
    thresholds: config.intimacy.thresholds,
  };
}

export async function getUnlocks(matchId: string, userId: string) {
  const match = await matchRepo.findMatchById(matchId);
  if (!match) {
    throw new AppError('Match not found', 404);
  }

  if (match.user1_id !== userId && match.user2_id !== userId) {
    throw new AppError('Not authorized', 403);
  }

  const intimacy = await intimacyRepo.findByMatchId(matchId);

  return {
    unlocks: intimacy?.unlocks || [],
    score: intimacy?.score || 0,
  };
}

export async function unlock(matchId: string, unlockType: string, userId: string) {
  const match = await matchRepo.findMatchById(matchId);
  if (!match) {
    throw new AppError('Match not found', 404);
  }

  if (match.user1_id !== userId && match.user2_id !== userId) {
    throw new AppError('Not authorized', 403);
  }

  if (!Object.values(UNLOCK_TYPES).includes(unlockType as any)) {
    throw new AppError('Invalid unlock type', 400);
  }

  const intimacy = await intimacyRepo.findByMatchId(matchId);
  if (!intimacy) {
    throw new AppError('Intimacy record not found', 404);
  }

  const threshold = config.intimacy.thresholds[unlockType as keyof typeof config.intimacy.thresholds];
  if (intimacy.score < threshold) {
    throw new AppError(`Intimacy score too low. Need ${threshold}, have ${intimacy.score}`, 400);
  }

  if (intimacy.unlocks.includes(unlockType)) {
    throw new AppError('Already unlocked', 400);
  }

  return intimacyRepo.addUnlock(matchId, unlockType);
}

export async function addPoints(matchId: string, points: number) {
  let intimacy = await intimacyRepo.findByMatchId(matchId);

  if (!intimacy) {
    intimacy = await intimacyRepo.createOrUpdate(matchId, points, []);
  } else {
    intimacy = await intimacyRepo.addPoints(matchId, points);
  }

  return intimacy;
}

export async function addMessagePoint(matchId: string) {
  const pointsPerMessage = 1 / config.intimacy.points.messagePerPoint;
  return addPoints(matchId, pointsPerMessage);
}

function getLevel(score: number): number {
  const { thresholds } = config.intimacy;
  if (score >= thresholds.call) return 4;
  if (score >= thresholds.occupation) return 3;
  if (score >= thresholds.photo) return 2;
  if (score >= thresholds.realName) return 1;
  return 0;
}

function getAvailableUnlocks(score: number, currentUnlocks: string[]): string[] {
  const { thresholds } = config.intimacy;
  const available: string[] = [];

  if (score >= thresholds.realName && !currentUnlocks.includes('real_name')) {
    available.push('real_name');
  }
  if (score >= thresholds.photo && !currentUnlocks.includes('photo')) {
    available.push('photo');
  }
  if (score >= thresholds.occupation && !currentUnlocks.includes('occupation')) {
    available.push('occupation');
  }
  if (score >= thresholds.call && !currentUnlocks.includes('call')) {
    available.push('call');
  }

  return available;
}
