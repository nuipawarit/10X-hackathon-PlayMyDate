'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

export type Message = {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender_name?: string;
};

export function useRealtimeMessages(matchId: string | undefined) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const lastMessageIdRef = useRef<string | null>(null);

  const fetchMessages = useCallback(async (isPolling = false) => {
    if (!matchId) return;

    try {
      const url = isPolling && lastMessageIdRef.current
        ? `/api/messages?matchId=${matchId}&after=${lastMessageIdRef.current}`
        : `/api/messages?matchId=${matchId}`;

      const res = await fetch(url, {
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Failed to fetch messages');
      }

      const data = await res.json();
      const newMessages = data.messages || [];

      if (isPolling && newMessages.length > 0) {
        setMessages((prev) => [...prev, ...newMessages]);
      } else if (!isPolling) {
        setMessages(newMessages);
      }

      if (newMessages.length > 0) {
        lastMessageIdRef.current = newMessages[newMessages.length - 1].id;
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, [matchId]);

  useEffect(() => {
    if (!matchId) return;

    lastMessageIdRef.current = null;
    setLoading(true);

    fetchMessages(false).finally(() => setLoading(false));

    const interval = setInterval(() => {
      fetchMessages(true);
    }, 3000);

    return () => {
      clearInterval(interval);
    };
  }, [matchId, fetchMessages]);

  const sendMessage = async (content: string) => {
    if (!matchId) {
      throw new Error('Match ID is required');
    }

    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        matchId,
        content,
      }),
    });

    if (!res.ok) {
      throw new Error('Failed to send message');
    }

    const data = await res.json();
    const newMessage = data.message;

    setMessages((prev) => [...prev, newMessage]);
    lastMessageIdRef.current = newMessage.id;

    return newMessage;
  };

  return { messages, loading, sendMessage };
}
