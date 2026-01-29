import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import {
  getMatch,
  getMessages,
  sendMessage,
  getIntimacy,
  getAvailableActivities,
  unlock,
} from '../services/api';
import { useAuth } from '../context/AuthContext';

interface Partner {
  id: string;
  display_name: string | null;
  playing_style: string[];
  interests: string[];
  bio: string | null;
}

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

interface Activity {
  id: string;
  name: string;
  type: string;
  description: string;
  intimacy_points: number;
}

interface Intimacy {
  score: number;
  level: number;
  unlocks: string[];
  available_unlocks: string[];
  thresholds: Record<string, number>;
}

const ACTIVITY_ICONS: Record<string, string> = {
  icebreaker: '🎯',
  conversation: '💬',
  quiz: '🎮',
  game: '🎲',
  creative: '🎨',
};

export default function MatchDetail() {
  const { matchId } = useParams<{ matchId: string }>();
  const { user, token } = useAuth();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [intimacy, setIntimacy] = useState<Intimacy | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showActivities, setShowActivities] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    loadData();
    setupSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave_match', matchId);
        socketRef.current.disconnect();
      }
    };
  }, [matchId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const setupSocket = () => {
    const socket = io('/', {
      auth: { token },
    });

    socket.on('connect', () => {
      socket.emit('join_match', matchId);
    });

    socket.on('new_message', (data: { message: Message }) => {
      setMessages((prev) => [...prev, data.message]);
    });

    socketRef.current = socket;
  };

  const loadData = async () => {
    try {
      const [matchRes, messagesRes, intimacyRes, activitiesRes] = await Promise.all([
        getMatch(matchId!),
        getMessages(matchId!),
        getIntimacy(matchId!),
        getAvailableActivities(matchId!),
      ]);

      setPartner(matchRes.data.partner);
      setMessages(messagesRes.data.messages);
      setIntimacy(intimacyRes.data);
      setActivities(activitiesRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const response = await sendMessage(matchId!, newMessage);
      setMessages((prev) => [...prev, response.data]);
      setNewMessage('');

      const intimacyRes = await getIntimacy(matchId!);
      setIntimacy(intimacyRes.data);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleUnlock = async (unlockType: string) => {
    try {
      await unlock(matchId!, unlockType);
      const intimacyRes = await getIntimacy(matchId!);
      setIntimacy(intimacyRes.data);
    } catch (error) {
      console.error('Failed to unlock:', error);
    }
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-120px)] flex flex-col gap-4">
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="skeleton w-14 h-14 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-5 w-32" />
              <div className="skeleton h-4 w-48" />
            </div>
            <div className="skeleton w-20 h-16 rounded-xl" />
          </div>
        </div>
        <div className="card flex-1">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                <div className="skeleton h-10 w-48 rounded-2xl" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const intimacyPercent = Math.min(100, Math.round(Number(intimacy?.score) || 0));

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col gap-4">
      {/* Header */}
      <div className="card animate-slide-up">
        <div className="flex items-center gap-4">
          <div className="avatar w-14 h-14 text-xl">
            {partner?.display_name?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-lg text-gray-800">{partner?.display_name || 'Anonymous'}</h2>
            <p className="text-sm text-gray-500 truncate">{partner?.bio || 'Ready to connect'}</p>
          </div>

          {/* Intimacy Display */}
          <div className="flex-shrink-0">
            <div className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-2xl p-3 text-center">
              <div className="text-xs text-gray-500 mb-1">Intimacy</div>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold gradient-text">
                  {intimacy?.level || 0}
                </div>
                <div className="text-xs text-gray-400">
                  Lv.
                </div>
              </div>
              <div className="progress-bar w-20 mt-2">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${intimacyPercent}%` }}
                />
              </div>
              <div className="text-xs text-gray-400 mt-1">{intimacyPercent}/100</div>
            </div>
          </div>
        </div>

        {/* Available Unlocks */}
        {intimacy && intimacy.available_unlocks.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100 animate-bounce-in">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🎁</span>
              <span className="text-sm font-medium text-gray-700">New unlocks available!</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {intimacy.available_unlocks.map((type) => (
                <button
                  key={type}
                  onClick={() => handleUnlock(type)}
                  className="unlock-badge hover:scale-105 transition-transform cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
                  </svg>
                  Unlock {type.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Activities Toggle */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <button
            onClick={() => setShowActivities(!showActivities)}
            className="w-full flex items-center justify-between p-3 bg-secondary-50 rounded-xl hover:bg-secondary-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">🎮</span>
              <span className="font-medium text-secondary-700">Activities</span>
              <span className="text-xs bg-secondary-200 text-secondary-700 px-2 py-0.5 rounded-full">
                {activities.length} available
              </span>
            </div>
            <svg
              className={`w-5 h-5 text-secondary-500 transition-transform ${showActivities ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Activities List */}
          {showActivities && activities.length > 0 && (
            <div className="mt-3 space-y-2 animate-slide-up">
              {activities.map((activity, index) => (
                <Link
                  key={activity.id}
                  to={`/matches/${matchId}/activity/${activity.id}`}
                  className="block p-4 bg-white border border-gray-100 rounded-xl hover:border-primary-200 transition-all hover:shadow-lg"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">
                      {ACTIVITY_ICONS[activity.type] || '🎯'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-800">{activity.name}</div>
                      <div className="text-sm text-gray-500 truncate">{activity.description}</div>
                    </div>
                    <div className="flex items-center gap-1 bg-primary-50 text-primary-600 px-2.5 py-1 rounded-full text-sm font-medium">
                      <span>+{activity.intimacy_points}</span>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"/>
                      </svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 card overflow-y-auto animate-fade-in">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-8">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-gray-500">No messages yet</p>
            <p className="text-sm text-gray-400 mt-1">Say hi to start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message, index) => (
              <div
                key={message.id}
                className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                style={{ animationDelay: `${index * 0.02}s` }}
              >
                <div
                  className={
                    message.sender_id === user?.id
                      ? 'message-bubble-sent'
                      : 'message-bubble-received'
                  }
                >
                  {message.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="flex gap-3 animate-slide-up">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="input flex-1"
          placeholder="Type a message..."
        />
        <button
          type="submit"
          disabled={sending || !newMessage.trim()}
          className="btn-primary px-6"
        >
          {sending ? (
            <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/>
            </svg>
          )}
        </button>
      </form>
    </div>
  );
}
