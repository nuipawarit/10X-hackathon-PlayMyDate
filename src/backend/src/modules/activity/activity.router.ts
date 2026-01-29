import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authMiddleware, AuthRequest } from '../../shared/middleware/auth.js';
import * as activityService from './activity.service.js';

const router = Router();

router.get('/match/:matchId', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const activities = await activityService.getAvailableActivities(
      req.params.matchId,
      req.user!.userId
    );
    res.json(activities);
  } catch (error) {
    next(error);
  }
});

router.get('/match/:matchId/instances', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const instances = await activityService.getActivityInstances(
      req.params.matchId,
      req.user!.userId
    );
    res.json(instances);
  } catch (error) {
    next(error);
  }
});

router.post('/match/:matchId/start/:activityId', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await activityService.startActivity(
      req.params.matchId,
      req.params.activityId,
      req.user!.userId
    );
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

const progressSchema = z.object({
  progress: z.record(z.any()),
});

router.put('/instance/:instanceId/progress', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { progress } = progressSchema.parse(req.body);
    const instance = await activityService.updateProgress(
      req.params.instanceId,
      progress,
      req.user!.userId
    );
    res.json(instance);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    next(error);
  }
});

const completeSchema = z.object({
  result: z.record(z.any()),
});

router.post('/instance/:instanceId/complete', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { result } = completeSchema.parse(req.body);
    const instance = await activityService.completeActivity(
      req.params.instanceId,
      result,
      req.user!.userId
    );
    res.json(instance);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    next(error);
  }
});

export { router as activityRouter };
