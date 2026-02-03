import { z } from 'zod';

export const unmatchSchema = z.object({
  matchId: z.string().uuid('Invalid match ID'),
});

export type UnmatchInput = z.infer<typeof unmatchSchema>;
