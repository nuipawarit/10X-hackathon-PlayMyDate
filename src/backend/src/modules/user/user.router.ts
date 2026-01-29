import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authMiddleware, AuthRequest } from '../../shared/middleware/auth.js';
import * as userService from './user.service.js';

const router = Router();

const updateProfileSchema = z.object({
  display_name: z.string().optional(),
  playing_style: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
  bio: z.string().optional(),
});

const updatePrivateDataSchema = z.object({
  real_name: z.string().optional(),
  photo_url: z.string().url().optional(),
  occupation: z.string().optional(),
  phone: z.string().optional(),
});

router.get('/me', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await userService.getProfile(req.user!.userId);
    res.json(user);
  } catch (error) {
    next(error);
  }
});

router.put('/me/profile', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = updateProfileSchema.parse(req.body);
    const user = await userService.updateProfile(req.user!.userId, data);
    res.json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    next(error);
  }
});

router.put('/me/private-data', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = updatePrivateDataSchema.parse(req.body);
    const user = await userService.updatePrivateData(req.user!.userId, data);
    res.json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    next(error);
  }
});

export { router as userRouter };
