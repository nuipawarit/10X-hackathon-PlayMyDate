import { Router, Response, NextFunction } from 'express';
import { authMiddleware, AuthRequest } from '../../shared/middleware/auth.js';
import * as intimacyService from './intimacy.service.js';

const router = Router();

router.get('/match/:matchId', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const intimacy = await intimacyService.getIntimacy(req.params.matchId, req.user!.userId);
    res.json(intimacy);
  } catch (error) {
    next(error);
  }
});

router.get('/match/:matchId/unlocks', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const unlocks = await intimacyService.getUnlocks(req.params.matchId, req.user!.userId);
    res.json(unlocks);
  } catch (error) {
    next(error);
  }
});

router.post('/match/:matchId/unlock/:unlockType', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await intimacyService.unlock(
      req.params.matchId,
      req.params.unlockType,
      req.user!.userId
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export { router as intimacyRouter };
