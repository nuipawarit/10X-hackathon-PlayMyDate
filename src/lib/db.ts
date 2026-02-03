import { sql } from '@vercel/postgres';

export { sql };

export type AvatarConfig = {
  style: 'cartoon' | 'realistic' | 'pixel';
  hairColor: string;
  hairStyle: string;
  skinTone: string;
  accessories: string[];
  background: string;
};

export type User = {
  id: string;
  email: string;
  password_hash: string;
  display_name: string | null;
  playing_style: string[];
  interests: string[];
  bio: string | null;
  real_name: string | null;
  photo_url: string | null;
  occupation: string | null;
  phone: string | null;
  avatar_config: AvatarConfig | null;
  voice_note_url: string | null;
  behavioral_persona: string | null;
  subscription_tier: string;
  subscription_expires_at: string | null;
  referral_code: string | null;
  referred_by_user_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Session = {
  id: string;
  user_id: string;
  expires_at: string;
};

export type Match = {
  id: string;
  user1_id: string;
  user2_id: string;
  compatibility_score: number;
  status: string;
  chemistry_score: number;
  mission_streak: number;
  paradise_mode_unlocked: boolean;
  paradise_mode_unlocked_at: string | null;
  last_activity_at: string;
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
};

export type Activity = {
  id: string;
  name: string;
  type: string;
  description: string | null;
  instructions: string | null;
  intimacy_points: number;
  config: Record<string, unknown>;
  coin_reward: number;
  difficulty_level: number;
  estimated_duration_minutes: number;
  is_branded: boolean;
  sponsor_merchant_id: string | null;
  created_at: string;
};

export type ActivityInstance = {
  id: string;
  match_id: string;
  activity_id: string;
  status: string;
  progress: Record<string, unknown>;
  result: Record<string, unknown> | null;
  coins_earned: number;
  expires_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
};

export type IntimacyScore = {
  id: string;
  match_id: string;
  score: number;
  unlocks: string[];
  updated_at: string;
};

export type TypingStatus = {
  id: string;
  match_id: string;
  user_id: string;
  is_typing: boolean;
  updated_at: string;
};

export const INTIMACY_THRESHOLDS = {
  real_name: 25,
  photo: 45,
  occupation: 65,
  call: 85,
} as const;

export type PublicUser = Omit<User, 'password_hash' | 'real_name' | 'photo_url' | 'occupation' | 'phone'> & {
  real_name?: string | null;
  photo_url?: string | null;
  occupation?: string | null;
  phone?: string | null;
};

export type PlaycoinWallet = {
  id: string;
  user_id: string;
  balance: number;
  lifetime_earned: number;
  lifetime_spent: number;
  created_at: string;
  updated_at: string;
};

export type PlaycoinTransaction = {
  id: string;
  wallet_id: string;
  type: 'earn' | 'burn' | 'purchase' | 'exchange';
  amount: number;
  balance_after: number;
  source: string | null;
  reference_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export type DailyCheckin = {
  id: string;
  user_id: string;
  checkin_date: string;
  streak_count: number;
  coins_earned: number;
  created_at: string;
};

export type Reward = {
  id: string;
  name: string;
  description: string | null;
  type: 'powerup' | 'avatar_item' | 'voucher' | 'partner_exchange';
  coin_cost: number;
  stock_quantity: number | null;
  partner_id: string | null;
  is_active: boolean;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export type UserReward = {
  id: string;
  user_id: string;
  reward_id: string;
  transaction_id: string | null;
  status: 'redeemed' | 'used' | 'expired';
  redeemed_at: string;
  used_at: string | null;
  expires_at: string | null;
};
