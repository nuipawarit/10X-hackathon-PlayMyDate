import { z } from 'zod';

export const unlockTypes = ['real_name', 'photo', 'occupation', 'call'] as const;

export const unlockSchema = z.object({
  matchId: z.string().uuid('Invalid match ID'),
  unlockType: z.enum(unlockTypes, { message: 'Invalid unlock type' }),
});

export type UnlockInput = z.infer<typeof unlockSchema>;
export type UnlockType = (typeof unlockTypes)[number];
