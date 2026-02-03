import { z } from 'zod';

export const startActivitySchema = z.object({
  matchId: z.string().uuid('Invalid match ID'),
  activityId: z.string().uuid('Invalid activity ID'),
});

export const completeActivitySchema = z.object({
  instanceId: z.string().uuid('Invalid instance ID'),
  result: z.record(z.string(), z.unknown()).optional(),
});

export type StartActivityInput = z.infer<typeof startActivitySchema>;
export type CompleteActivityInput = z.infer<typeof completeActivitySchema>;
