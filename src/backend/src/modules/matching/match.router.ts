import { Router, Response, NextFunction } from 'express';
import { authMiddleware, AuthRequest } from '../../shared/middleware/auth.js';
import * as matchService from './match.service.js';

const router = Router();

router.get('/me', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const matches = await matchService.getMyMatches(req.user!.userId);
    res.json(matches);
  } catch (error) {
    next(error);
  }
});

router.post('/find', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const matches = await matchService.findMatches(req.user!.userId);
    res.json(matches);
  } catch (error) {
    next(error);
  }
});

router.get('/:matchId', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const match = await matchService.getMatchDetail(req.params.matchId, req.user!.userId);
    res.json(match);
  } catch (error) {
    next(error);
  }
});

router.post('/:matchId/unmatch', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const match = await matchService.unmatch(req.params.matchId, req.user!.userId);
    res.json(match);
  } catch (error) {
    next(error);
  }
});

export { router as matchRouter };
