import { supabase, Profile, INTIMACY_THRESHOLDS } from '../lib/supabase';

// Auth
export const login = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('auth_id', data.user.id)
    .single();

  return { data: { token: data.session?.access_token, user: profile } };
};

export const register = async (email: string, password: string, display_name?: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name },
    },
  });

  if (error) throw error;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('auth_id', data.user?.id)
    .single();

  return { data: { token: data.session?.access_token, user: profile } };
};

export const logout = async () => {
  await supabase.auth.signOut();
};

// User
export const getProfile = async () => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('auth_id', user.id)
    .single();

  if (error) throw error;
  return { data };
};

export const updateProfile = async (profileData: {
  display_name?: string;
  playing_style?: string[];
  interests?: string[];
  bio?: string;
}) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('profiles')
    .update(profileData)
    .eq('auth_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return { data };
};

export const updatePrivateData = async (privateData: {
  real_name?: string;
  photo_url?: string;
  occupation?: string;
}) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('profiles')
    .update(privateData)
    .eq('auth_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return { data };
};

// Matches
export const getMatches = async () => {
  const profile = await getCurrentProfile();

  const { data: matches, error } = await supabase
    .from('matches')
    .select('*')
    .or(`user1_id.eq.${profile.id},user2_id.eq.${profile.id}`)
    .eq('status', 'matched');

  if (error) throw error;

  const matchesWithPartners = await Promise.all(
    matches.map(async (match) => {
      const partnerId = match.user1_id === profile.id ? match.user2_id : match.user1_id;
      const { data: partner } = await supabase
        .from('profiles')
        .select('id, display_name, playing_style, interests, bio')
        .eq('id', partnerId)
        .single();

      return { match, partner };
    })
  );

  return { data: matchesWithPartners };
};

export const findMatches = async () => {
  const { data, error } = await supabase.functions.invoke('match-find');
  if (error) throw error;
  return { data: data.matches };
};

export const getMatch = async (matchId: string) => {
  const profile = await getCurrentProfile();

  const { data: match, error } = await supabase
    .from('matches')
    .select('*')
    .eq('id', matchId)
    .single();

  if (error) throw error;

  const partnerId = match.user1_id === profile.id ? match.user2_id : match.user1_id;
  const { data: partner } = await supabase
    .from('profiles')
    .select('id, display_name, playing_style, interests, bio')
    .eq('id', partnerId)
    .single();

  return { data: { match, partner } };
};

export const unmatch = async (matchId: string) => {
  const { data, error } = await supabase.functions.invoke('match-unmatch', {
    body: { matchId },
  });
  if (error) throw error;
  return { data };
};

// Activities
export const getAvailableActivities = async (_matchId: string) => {
  const { data, error } = await supabase
    .from('activities')
    .select('*');

  if (error) throw error;
  return { data };
};

export const getActivityInstances = async (matchId: string) => {
  const { data, error } = await supabase
    .from('activity_instances')
    .select('*, activities(*)')
    .eq('match_id', matchId);

  if (error) throw error;
  return { data };
};

export const startActivity = async (matchId: string, activityId: string) => {
  const { data, error } = await supabase.functions.invoke('activity-start', {
    body: { matchId, activityId },
  });
  if (error) throw error;
  return { data };
};

export const completeActivity = async (instanceId: string, result: Record<string, unknown>) => {
  const { data, error } = await supabase.functions.invoke('activity-complete', {
    body: { instanceId, result },
  });
  if (error) throw error;
  return { data };
};

// Intimacy
export const getIntimacy = async (matchId: string) => {
  const { data, error } = await supabase
    .from('intimacy_scores')
    .select('*')
    .eq('match_id', matchId)
    .single();

  if (error) throw error;

  const level = getLevel(data.score);
  const availableUnlocks = getAvailableUnlocks(data.score, data.unlocks);

  return {
    data: {
      ...data,
      level,
      available_unlocks: availableUnlocks,
      thresholds: INTIMACY_THRESHOLDS,
    },
  };
};

export const getUnlocks = async (matchId: string) => {
  const { data, error } = await supabase
    .from('intimacy_scores')
    .select('unlocks, score')
    .eq('match_id', matchId)
    .single();

  if (error) throw error;
  return { data };
};

export const unlock = async (matchId: string, unlockType: string) => {
  const { data, error } = await supabase.functions.invoke('intimacy-unlock', {
    body: { matchId, unlockType },
  });
  if (error) throw error;
  return { data };
};

// Messages
export const getMessages = async (matchId: string, limit?: number, offset?: number) => {
  let query = supabase
    .from('messages')
    .select('*')
    .eq('match_id', matchId)
    .order('created_at', { ascending: true });

  if (limit) query = query.limit(limit);
  if (offset) query = query.range(offset, offset + (limit || 50) - 1);

  const { data, error } = await query;
  if (error) throw error;
  return { data: { messages: data } };
};

export const sendMessage = async (matchId: string, content: string) => {
  const profile = await getCurrentProfile();

  const { data, error } = await supabase
    .from('messages')
    .insert({
      match_id: matchId,
      sender_id: profile.id,
      content,
    })
    .select()
    .single();

  if (error) throw error;
  return { data };
};

// Helper functions
async function getCurrentProfile(): Promise<Profile> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('auth_id', user.id)
    .single();

  if (error) throw error;
  return data;
}

function getLevel(score: number): number {
  if (score >= INTIMACY_THRESHOLDS.call) return 4;
  if (score >= INTIMACY_THRESHOLDS.occupation) return 3;
  if (score >= INTIMACY_THRESHOLDS.photo) return 2;
  if (score >= INTIMACY_THRESHOLDS.real_name) return 1;
  return 0;
}

function getAvailableUnlocks(score: number, currentUnlocks: string[]): string[] {
  const available: string[] = [];

  if (score >= INTIMACY_THRESHOLDS.real_name && !currentUnlocks.includes('real_name')) {
    available.push('real_name');
  }
  if (score >= INTIMACY_THRESHOLDS.photo && !currentUnlocks.includes('photo')) {
    available.push('photo');
  }
  if (score >= INTIMACY_THRESHOLDS.occupation && !currentUnlocks.includes('occupation')) {
    available.push('occupation');
  }
  if (score >= INTIMACY_THRESHOLDS.call && !currentUnlocks.includes('call')) {
    available.push('call');
  }

  return available;
}
