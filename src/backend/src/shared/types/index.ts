export interface User {
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
  created_at: Date;
  updated_at: Date;
}

export interface PublicUser {
  id: string;
  display_name: string | null;
  playing_style: string[];
  interests: string[];
  bio: string | null;
}

export interface Match {
  id: string;
  user1_id: string;
  user2_id: string;
  compatibility_score: number;
  status: 'matched' | 'unmatched' | 'blocked';
  created_at: Date;
  updated_at: Date;
}

export interface Activity {
  id: string;
  name: string;
  type: string;
  description: string | null;
  instructions: string | null;
  intimacy_points: number;
  config: Record<string, any>;
  created_at: Date;
}

export interface ActivityInstance {
  id: string;
  match_id: string;
  activity_id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress: Record<string, any>;
  result: Record<string, any> | null;
  started_at: Date | null;
  completed_at: Date | null;
  created_at: Date;
}

export interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: Date;
}

export interface IntimacyScore {
  id: string;
  match_id: string;
  score: number;
  unlocks: string[];
  updated_at: Date;
}

export interface JwtPayload {
  userId: string;
  email: string;
}

export interface AuthRequest extends Express.Request {
  user?: JwtPayload;
}
