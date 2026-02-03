import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  displayName: z.string().max(100).optional(),
});

export const updateProfileSchema = z.object({
  displayName: z.string().max(100).optional(),
  playingStyle: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
  bio: z.string().max(500).optional(),
  realName: z.string().max(100).optional(),
  photoUrl: z.string().url().optional(),
  occupation: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
