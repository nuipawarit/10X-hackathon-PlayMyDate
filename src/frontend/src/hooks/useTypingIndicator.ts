import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useTypingIndicator(matchId: string | undefined, currentUserId: string | undefined) {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  useEffect(() => {
    if (!matchId || !currentUserId) return;

    const channel = supabase.channel(`typing:${matchId}`);

    channel
      .on('broadcast', { event: 'typing' }, (payload) => {
        const userId = payload.payload?.userId;
        if (userId && userId !== currentUserId) {
          setTypingUsers((prev) => {
            if (!prev.includes(userId)) {
              return [...prev, userId];
            }
            return prev;
          });

          setTimeout(() => {
            setTypingUsers((prev) => prev.filter((id) => id !== userId));
          }, 3000);
        }
      })
      .on('broadcast', { event: 'stop_typing' }, (payload) => {
        const userId = payload.payload?.userId;
        if (userId) {
          setTypingUsers((prev) => prev.filter((id) => id !== userId));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId, currentUserId]);

  const sendTyping = useCallback(() => {
    if (!matchId || !currentUserId) return;

    const channel = supabase.channel(`typing:${matchId}`);
    channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId: currentUserId },
    });
  }, [matchId, currentUserId]);

  const sendStopTyping = useCallback(() => {
    if (!matchId || !currentUserId) return;

    const channel = supabase.channel(`typing:${matchId}`);
    channel.send({
      type: 'broadcast',
      event: 'stop_typing',
      payload: { userId: currentUserId },
    });
  }, [matchId, currentUserId]);

  return { typingUsers, sendTyping, sendStopTyping };
}
