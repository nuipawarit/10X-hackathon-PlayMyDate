export const INTIMACY_THRESHOLDS = {
  real_name: 25,
  photo: 45,
  occupation: 65,
  call: 85,
} as const;

export type User = {
  id: string;
  email: string;
  display_name: string | null;
  playing_style: string[];
  interests: string[];
  bio: string | null;
  real_name: string | null;
  photo_url: string | null;
  occupation: string | null;
};

export type Partner = {
  id: string;
  display_name: string | null;
  playing_style: string[];
  interests: string[];
  bio: string | null;
  real_name?: string | null;
  photo_url?: string | null;
  occupation?: string | null;
};

export type Match = {
  id: string;
  user1_id: string;
  user2_id: string;
  compatibility_score: number;
  status: string;
  created_at: string;
  updated_at: string;
};

export type Activity = {
  id: string;
  name: string;
  type: string;
  description: string | null;
  instructions: string | null;
  intimacy_points: number;
  config?: Record<string, unknown>;
  created_at?: string;
};

export type ActivityInstance = {
  id: string;
  match_id: string;
  activity_id: string;
  status: string;
  progress?: Record<string, unknown>;
  result?: Record<string, unknown> | null;
  started_at?: string | null;
  completed_at?: string | null;
  created_at?: string;
  activity_name?: string;
  activity_type?: string;
  activity_description?: string;
  intimacy_points?: number;
};

export type Intimacy = {
  id?: string;
  match_id?: string;
  score: number;
  unlocks: string[];
  updated_at?: string;
  level?: number;
  available_unlocks?: string[];
  thresholds?: typeof INTIMACY_THRESHOLDS;
};

async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return res.json();
}

// Auth
export const login = async (email: string, password: string) => {
  return fetchApi<{ user: { id: string; email: string; displayName: string | null } }>(
    '/api/auth/login',
    {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }
  );
};

export const register = async (email: string, password: string, display_name?: string) => {
  return fetchApi<{ user: { id: string; email: string; displayName: string | null } }>(
    '/api/auth/register',
    {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName: display_name }),
    }
  );
};

export const logout = async () => {
  return fetchApi<{ success: boolean }>('/api/auth/logout', {
    method: 'POST',
  });
};

// User
export const getProfile = async () => {
  const data = await fetchApi<{ profile: User }>('/api/users/profile');
  return { data: data.profile };
};

export const updateProfile = async (profileData: {
  display_name?: string;
  playing_style?: string[];
  interests?: string[];
  bio?: string;
}) => {
  const data = await fetchApi<{ profile: User }>('/api/users/profile', {
    method: 'PUT',
    body: JSON.stringify({
      displayName: profileData.display_name,
      playingStyle: profileData.playing_style,
      interests: profileData.interests,
      bio: profileData.bio,
    }),
  });
  return { data: data.profile };
};

export const updatePrivateData = async (privateData: {
  real_name?: string;
  photo_url?: string;
  occupation?: string;
}) => {
  const data = await fetchApi<{ profile: User }>('/api/users/profile', {
    method: 'PUT',
    body: JSON.stringify({
      realName: privateData.real_name,
      photoUrl: privateData.photo_url,
      occupation: privateData.occupation,
    }),
  });
  return { data: data.profile };
};

// Matches
export const getMatches = async () => {
  const data = await fetchApi<{ matches: Array<{ id: string; user1_id: string; user2_id: string; compatibility_score: number; status: string; created_at: string; updated_at: string; partner: Partner }> }>('/api/matches');
  const matchesWithPartners = data.matches.map((m) => ({
    match: {
      id: m.id,
      user1_id: m.user1_id,
      user2_id: m.user2_id,
      compatibility_score: m.compatibility_score,
      status: m.status,
      created_at: m.created_at,
      updated_at: m.updated_at,
    } as Match,
    partner: m.partner as Partner,
  }));
  return { data: matchesWithPartners };
};

export const findMatches = async () => {
  const data = await fetchApi<{ matches: Array<{ match: Match; partner: Partner; compatibility_score: number }> }>('/api/matches/find', {
    method: 'POST',
  });
  return { data: data.matches };
};

export const getMatch = async (matchId: string) => {
  const data = await fetchApi<{ match: Match & { partner: Partner } }>(`/api/matches/${matchId}`);
  return {
    data: {
      match: {
        id: data.match.id,
        user1_id: data.match.user1_id,
        user2_id: data.match.user2_id,
        compatibility_score: data.match.compatibility_score,
        status: data.match.status,
        created_at: data.match.created_at,
        updated_at: data.match.updated_at,
      } as Match,
      partner: data.match.partner as Partner,
    },
  };
};

export const unmatch = async (matchId: string) => {
  const data = await fetchApi<{ match: Match }>('/api/matches/unmatch', {
    method: 'POST',
    body: JSON.stringify({ matchId }),
  });
  return { data };
};

// Activities
export const getAvailableActivities = async () => {
  const data = await fetchApi<{ activities: Activity[] }>('/api/activities');
  return { data: data.activities };
};

export const getActivityInstances = async (matchId: string) => {
  const data = await fetchApi<{ instances: ActivityInstance[] }>(
    `/api/activities/instances?matchId=${matchId}`
  );
  return { data: data.instances };
};

export const startActivity = async (matchId: string, activityId: string) => {
  const data = await fetchApi<{ instance: ActivityInstance; activity: Activity }>(
    '/api/activities/start',
    {
      method: 'POST',
      body: JSON.stringify({ matchId, activityId }),
    }
  );
  return { data };
};

export const completeActivity = async (instanceId: string, result: Record<string, unknown>) => {
  const data = await fetchApi<{ instance: ActivityInstance }>('/api/activities/complete', {
    method: 'POST',
    body: JSON.stringify({ instanceId, result }),
  });
  return { data };
};

// Intimacy
export const getIntimacy = async (matchId: string) => {
  const data = await fetchApi<{
    intimacy: { id: string; match_id: string; score: number; unlocks: string[]; updated_at: string };
    available_unlocks: string[];
    thresholds: typeof INTIMACY_THRESHOLDS;
  }>(`/api/intimacy?matchId=${matchId}`);

  const score = data.intimacy.score;
  const level = getLevel(score);

  return {
    data: {
      ...data.intimacy,
      level,
      available_unlocks: data.available_unlocks,
      thresholds: data.thresholds,
    } as Intimacy,
  };
};

export const getUnlocks = async (matchId: string) => {
  const data = await fetchApi<{
    intimacy: { unlocks: string[]; score: number };
  }>(`/api/intimacy?matchId=${matchId}`);
  return { data: { unlocks: data.intimacy.unlocks, score: data.intimacy.score } };
};

export const unlock = async (matchId: string, unlockType: string) => {
  const data = await fetchApi<{
    intimacy: Intimacy;
    available_unlocks: string[];
    thresholds: typeof INTIMACY_THRESHOLDS;
  }>('/api/intimacy/unlock', {
    method: 'POST',
    body: JSON.stringify({ matchId, unlockType }),
  });

  const level = getLevel(data.intimacy.score);

  return {
    data: {
      ...data.intimacy,
      level,
      available_unlocks: data.available_unlocks,
      thresholds: data.thresholds,
    } as Intimacy,
  };
};

// Messages
export const getMessages = async (matchId: string, limit?: number) => {
  const params = new URLSearchParams({ matchId });
  if (limit) params.append('limit', limit.toString());

  const data = await fetchApi<{ messages: Array<{ id: string; match_id: string; sender_id: string; content: string; is_read: boolean; created_at: string; sender_name?: string }> }>(
    `/api/messages?${params.toString()}`
  );
  return { data: { messages: data.messages } };
};

export const sendMessage = async (matchId: string, content: string) => {
  const data = await fetchApi<{ message: { id: string; match_id: string; sender_id: string; content: string; is_read: boolean; created_at: string; sender_name?: string } }>('/api/messages', {
    method: 'POST',
    body: JSON.stringify({ matchId, content }),
  });
  return { data: data.message };
};

function getLevel(score: number): number {
  if (score >= INTIMACY_THRESHOLDS.call) return 4;
  if (score >= INTIMACY_THRESHOLDS.occupation) return 3;
  if (score >= INTIMACY_THRESHOLDS.photo) return 2;
  if (score >= INTIMACY_THRESHOLDS.real_name) return 1;
  return 0;
}

// Database
export const seedDatabase = async () => {
  const res = await fetch('/api/seed', {
    method: 'POST',
    headers: { 'x-seed-key': 'dev-seed-key-123' },
  });
  return res.json();
};
