import { sql } from '@/lib/db';
import { success, failure, type ServiceResult } from './types';

export interface BehavioralProfile {
  id: string;
  user_id: string;
  persona_type: string | null;
  engagement_score: string;
  activity_patterns: Record<string, unknown> | null;
  preferences: Record<string, unknown> | null;
  last_analyzed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export type PersonaType = 'explorer' | 'connector' | 'achiever' | 'casual' | 'premium';

const PERSONA_THRESHOLDS = {
  explorer: { activityVariety: 5, venueSearches: 10 },
  connector: { messagesPerMatch: 20, matchResponseRate: 0.8 },
  achiever: { missionsCompleted: 15, streakDays: 7 },
  premium: { subscriptionTier: 'premium', coinsSpent: 500 },
  casual: { default: true },
};

export async function analyzeUserBehavior(userId: string): Promise<ServiceResult<{
  profile: BehavioralProfile;
  insights: Record<string, unknown>;
}>> {
  try {
    const activityResult = await sql`
      SELECT COUNT(*) as total_activities,
             COUNT(DISTINCT activity_id) as unique_activities,
             AVG(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completion_rate
      FROM activity_instances ai
      JOIN matches m ON ai.match_id = m.id
      WHERE m.user1_id = ${userId} OR m.user2_id = ${userId}
    `;

    const messageResult = await sql`
      SELECT COUNT(*) as total_messages
      FROM messages msg
      JOIN matches m ON msg.match_id = m.id
      WHERE msg.sender_id = ${userId}
    `;

    const checkinResult = await sql`
      SELECT COUNT(*) as total_checkins,
             MAX(streak_count) as max_streak
      FROM daily_checkins
      WHERE user_id = ${userId}
    `;

    const insights = {
      totalActivities: parseInt(activityResult.rows[0]?.total_activities || '0', 10),
      uniqueActivities: parseInt(activityResult.rows[0]?.unique_activities || '0', 10),
      completionRate: parseFloat(activityResult.rows[0]?.completion_rate || '0'),
      totalMessages: parseInt(messageResult.rows[0]?.total_messages || '0', 10),
      totalCheckins: parseInt(checkinResult.rows[0]?.total_checkins || '0', 10),
      maxStreak: parseInt(checkinResult.rows[0]?.max_streak || '0', 10),
    };

    const engagementScore = calculateEngagementScore(insights);
    const personaType = determinePersonaType(insights);

    const profileResult = await sql`
      INSERT INTO user_behavioral_profiles (user_id, persona_type, engagement_score, last_analyzed_at)
      VALUES (${userId}, ${personaType}, ${engagementScore}, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        persona_type = ${personaType},
        engagement_score = ${engagementScore},
        last_analyzed_at = NOW(),
        updated_at = NOW()
      RETURNING *
    `;

    return success({
      profile: profileResult.rows[0] as BehavioralProfile,
      insights,
    });
  } catch (error) {
    console.error('analyzeUserBehavior error:', error);
    return failure('Failed to analyze user behavior', 'INTERNAL_ERROR');
  }
}

export async function updateBehavioralProfile(
  userId: string,
  updates: { preferences?: Record<string, unknown>; activityPatterns?: Record<string, unknown> }
): Promise<ServiceResult<BehavioralProfile>> {
  try {
    const result = await sql`
      UPDATE user_behavioral_profiles
      SET
        preferences = COALESCE(${updates.preferences ? JSON.stringify(updates.preferences) : null}::jsonb, preferences),
        activity_patterns = COALESCE(${updates.activityPatterns ? JSON.stringify(updates.activityPatterns) : null}::jsonb, activity_patterns),
        updated_at = NOW()
      WHERE user_id = ${userId}
      RETURNING *
    `;

    if (result.rows.length === 0) {
      const insertResult = await sql`
        INSERT INTO user_behavioral_profiles (user_id, preferences, activity_patterns)
        VALUES (
          ${userId},
          ${updates.preferences ? JSON.stringify(updates.preferences) : null}::jsonb,
          ${updates.activityPatterns ? JSON.stringify(updates.activityPatterns) : null}::jsonb
        )
        RETURNING *
      `;
      return success(insertResult.rows[0] as BehavioralProfile);
    }

    return success(result.rows[0] as BehavioralProfile);
  } catch (error) {
    console.error('updateBehavioralProfile error:', error);
    return failure('Failed to update behavioral profile', 'INTERNAL_ERROR');
  }
}

export async function getPersonaType(userId: string): Promise<ServiceResult<PersonaType>> {
  try {
    const result = await sql`
      SELECT persona_type FROM user_behavioral_profiles WHERE user_id = ${userId}
    `;

    if (result.rows.length === 0 || !result.rows[0].persona_type) {
      const analysisResult = await analyzeUserBehavior(userId);
      if (!analysisResult.success) {
        return failure(analysisResult.error, analysisResult.code);
      }
      return success((analysisResult.data.profile.persona_type || 'casual') as PersonaType);
    }

    return success(result.rows[0].persona_type as PersonaType);
  } catch (error) {
    console.error('getPersonaType error:', error);
    return failure('Failed to get persona type', 'INTERNAL_ERROR');
  }
}

export async function getBehavioralProfile(userId: string): Promise<ServiceResult<BehavioralProfile | null>> {
  try {
    const result = await sql`
      SELECT * FROM user_behavioral_profiles WHERE user_id = ${userId}
    `;

    return success(result.rows[0] as BehavioralProfile | null);
  } catch (error) {
    console.error('getBehavioralProfile error:', error);
    return failure('Failed to get behavioral profile', 'INTERNAL_ERROR');
  }
}

function calculateEngagementScore(insights: Record<string, number>): number {
  const weights = {
    totalActivities: 2,
    uniqueActivities: 3,
    completionRate: 20,
    totalMessages: 0.5,
    totalCheckins: 1,
    maxStreak: 2,
  };

  let score = 0;
  for (const [key, value] of Object.entries(insights)) {
    const weight = weights[key as keyof typeof weights] || 0;
    score += value * weight;
  }

  return Math.min(100, Math.round(score * 100) / 100);
}

function determinePersonaType(insights: Record<string, number>): PersonaType {
  if (insights.uniqueActivities >= PERSONA_THRESHOLDS.explorer.activityVariety) {
    return 'explorer';
  }
  if (insights.totalMessages >= 50) {
    return 'connector';
  }
  if (insights.maxStreak >= PERSONA_THRESHOLDS.achiever.streakDays) {
    return 'achiever';
  }
  return 'casual';
}
