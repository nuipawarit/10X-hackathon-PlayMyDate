import { z } from 'zod';

export const sendMessageSchema = z.object({
  matchId: z.string().uuid('Invalid match ID'),
  content: z.string().min(1, 'Message cannot be empty').max(2000, 'Message too long'),
});

export const getMessagesSchema = z.object({
  matchId: z.string().uuid('Invalid match ID'),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type GetMessagesInput = z.infer<typeof getMessagesSchema>;
