import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authMiddleware, AuthRequest } from '../../shared/middleware/auth.js';
import * as messageService from './message.service.js';

const router = Router();

router.get('/match/:matchId', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await messageService.getMessages(
      req.params.matchId,
      req.user!.userId,
      limit,
      offset
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
});

const sendMessageSchema = z.object({
  content: z.string().min(1).max(2000),
});

router.post('/match/:matchId', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { content } = sendMessageSchema.parse(req.body);
    const message = await messageService.sendMessage(
      req.params.matchId,
      req.user!.userId,
      content
    );
    res.status(201).json(message);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    next(error);
  }
});

router.put('/:messageId/read', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const message = await messageService.markAsRead(req.params.messageId, req.user!.userId);
    res.json(message);
  } catch (error) {
    next(error);
  }
});

router.put('/match/:matchId/read-all', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await messageService.markAllAsRead(req.params.matchId, req.user!.userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export { router as messageRouter };
