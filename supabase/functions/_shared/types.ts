export interface Profile {
  id: string;
  auth_id: string;
  email: string;
  display_name: string | null;
  playing_style: string[];
  interests: string[];
  bio: string | null;
  real_name: string | null;
  photo_url: string | null;
  occupation: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface Match {
  id: string;
  user1_id: string;
  user2_id: string;
  compatibility_score: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: string;
  name: string;
  type: string;
  description: string | null;
  instructions: string | null;
  intimacy_points: number;
  config: Record<string, any>;
  created_at: string;
}

export interface ActivityInstance {
  id: string;
  match_id: string;
  activity_id: string;
  status: string;
  progress: Record<string, any>;
  result: Record<string, any> | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface IntimacyScore {
  id: string;
  match_id: string;
  score: number;
  unlocks: string[];
  updated_at: string;
}

export const INTIMACY_THRESHOLDS = {
  real_name: 25,
  photo: 45,
  occupation: 65,
  call: 85,
} as const;
