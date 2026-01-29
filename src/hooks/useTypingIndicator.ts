'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

export function useTypingIndicator(matchId: string | undefined, currentUserId: string | undefined) {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!matchId || !currentUserId) return;

    const pollTypingStatus = async () => {
      try {
        const res = await fetch(`/api/typing?matchId=${matchId}`, {
          credentials: 'include',
        });

        if (res.ok) {
          const data = await res.json();
          if (data.isTyping) {
            setTypingUsers(['partner']);
          } else {
            setTypingUsers([]);
          }
        }
      } catch (error) {
        console.error('Error polling typing status:', error);
      }
    };

    const interval = setInterval(pollTypingStatus, 1500);

    return () => {
      clearInterval(interval);
    };
  }, [matchId, currentUserId]);

  const sendTyping = useCallback(() => {
    if (!matchId || !currentUserId) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    fetch('/api/typing', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        matchId,
        isTyping: true,
      }),
    }).catch((error) => {
      console.error('Error sending typing status:', error);
    });

    typingTimeoutRef.current = setTimeout(() => {
      fetch('/api/typing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          matchId,
          isTyping: false,
        }),
      }).catch((error) => {
        console.error('Error sending stop typing status:', error);
      });
    }, 3000);
  }, [matchId, currentUserId]);

  const sendStopTyping = useCallback(() => {
    if (!matchId || !currentUserId) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    fetch('/api/typing', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        matchId,
        isTyping: false,
      }),
    }).catch((error) => {
      console.error('Error sending stop typing status:', error);
    });
  }, [matchId, currentUserId]);

  return { typingUsers, sendTyping, sendStopTyping };
}
