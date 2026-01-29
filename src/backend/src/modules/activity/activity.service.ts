import { AppError } from '../../shared/middleware/error.js';
import * as activityRepo from './activity.repository.js';
import * as matchRepo from '../matching/match.repository.js';
import * as intimacyService from '../intimacy/intimacy.service.js';

export async function getAvailableActivities(matchId: string, userId: string) {
  const match = await matchRepo.findMatchById(matchId);
  if (!match) {
    throw new AppError('Match not found', 404);
  }

  if (match.user1_id !== userId && match.user2_id !== userId) {
    throw new AppError('Not authorized', 403);
  }

  return activityRepo.getAvailableActivities(matchId);
}

export async function getActivityInstances(matchId: string, userId: string) {
  const match = await matchRepo.findMatchById(matchId);
  if (!match) {
    throw new AppError('Match not found', 404);
  }

  if (match.user1_id !== userId && match.user2_id !== userId) {
    throw new AppError('Not authorized', 403);
  }

  return activityRepo.findInstancesByMatch(matchId);
}

export async function startActivity(matchId: string, activityId: string, userId: string) {
  const match = await matchRepo.findMatchById(matchId);
  if (!match) {
    throw new AppError('Match not found', 404);
  }

  if (match.user1_id !== userId && match.user2_id !== userId) {
    throw new AppError('Not authorized', 403);
  }

  const activity = await activityRepo.findActivityById(activityId);
  if (!activity) {
    throw new AppError('Activity not found', 404);
  }

  const instance = await activityRepo.createActivityInstance(matchId, activityId);

  return {
    instance,
    activity,
  };
}

export async function updateProgress(
  instanceId: string,
  progress: Record<string, any>,
  userId: string
) {
  const instance = await activityRepo.findInstanceById(instanceId);
  if (!instance) {
    throw new AppError('Activity instance not found', 404);
  }

  const match = await matchRepo.findMatchById(instance.match_id);
  if (!match) {
    throw new AppError('Match not found', 404);
  }

  if (match.user1_id !== userId && match.user2_id !== userId) {
    throw new AppError('Not authorized', 403);
  }

  return activityRepo.updateInstanceProgress(instanceId, progress);
}

export async function completeActivity(
  instanceId: string,
  result: Record<string, any>,
  userId: string
) {
  const instance = await activityRepo.findInstanceById(instanceId);
  if (!instance) {
    throw new AppError('Activity instance not found', 404);
  }

  const match = await matchRepo.findMatchById(instance.match_id);
  if (!match) {
    throw new AppError('Match not found', 404);
  }

  if (match.user1_id !== userId && match.user2_id !== userId) {
    throw new AppError('Not authorized', 403);
  }

  const activity = await activityRepo.findActivityById(instance.activity_id);
  const completedInstance = await activityRepo.completeInstance(instanceId, result);

  if (activity) {
    await intimacyService.addPoints(instance.match_id, activity.intimacy_points);
  }

  return completedInstance;
}
