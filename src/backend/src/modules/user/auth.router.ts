import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as userService from './user.service.js';
import { resetAndSeed } from '../../database/seed.js';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  display_name: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, display_name } = registerSchema.parse(req.body);
    const result = await userService.register(email, password, display_name);
    res.status(201).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    next(error);
  }
});

router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Reset database before login (demo mode)
    await resetAndSeed();

    const { email, password } = loginSchema.parse(req.body);
    const result = await userService.login(email, password);
    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    next(error);
  }
});

router.post('/logout', (req: Request, res: Response) => {
  res.json({ message: 'Logged out successfully' });
});

export { router as authRouter };
