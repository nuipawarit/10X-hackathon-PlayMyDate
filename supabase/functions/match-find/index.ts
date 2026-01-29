import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { getSupabaseAdmin, getCurrentProfile } from '../_shared/supabase-client.ts';
import { Profile } from '../_shared/types.ts';

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { profile: currentProfile, error: profileError } = await getCurrentProfile(authHeader);
    if (profileError || !currentProfile) {
      return new Response(JSON.stringify({ error: profileError || 'Profile not found' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { data: existingMatchIds } = await supabaseAdmin
      .from('matches')
      .select('user1_id, user2_id')
      .or(`user1_id.eq.${currentProfile.id},user2_id.eq.${currentProfile.id}`);

    const matchedUserIds = new Set<string>();
    matchedUserIds.add(currentProfile.id);
    existingMatchIds?.forEach((m) => {
      matchedUserIds.add(m.user1_id);
      matchedUserIds.add(m.user2_id);
    });

    const { data: potentialMatches } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .not('id', 'in', `(${Array.from(matchedUserIds).join(',')})`)
      .limit(20);

    if (!potentialMatches || potentialMatches.length === 0) {
      return new Response(JSON.stringify({ matches: [], message: 'No potential matches found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const createdMatches = [];

    for (const candidate of potentialMatches) {
      const score = calculateCompatibility(currentProfile, candidate);

      if (score >= 30) {
        const [user1_id, user2_id] =
          currentProfile.id < candidate.id
            ? [currentProfile.id, candidate.id]
            : [candidate.id, currentProfile.id];

        const { data: match, error: matchError } = await supabaseAdmin
          .from('matches')
          .insert({
            user1_id,
            user2_id,
            compatibility_score: score,
            status: 'matched',
          })
          .select()
          .single();

        if (!matchError && match) {
          createdMatches.push({
            match,
            partner: sanitizePartner(candidate),
            compatibility_score: score,
          });
        }
      }
    }

    return new Response(JSON.stringify({ matches: createdMatches }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function calculateCompatibility(user1: Profile, user2: Profile): number {
  const style1 = new Set(user1.playing_style || []);
  const style2 = new Set(user2.playing_style || []);
  const interests1 = new Set(user1.interests || []);
  const interests2 = new Set(user2.interests || []);

  const styleScore = jaccardSimilarity(style1, style2);
  const interestScore = jaccardSimilarity(interests1, interests2);

  const totalScore = (styleScore * 0.4 + interestScore * 0.6) * 100;
  return Math.round(totalScore * 100) / 100;
}

function jaccardSimilarity(set1: Set<string>, set2: Set<string>): number {
  if (set1.size === 0 && set2.size === 0) return 0.5;

  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  return intersection.size / union.size;
}

function sanitizePartner(user: Profile) {
  return {
    id: user.id,
    display_name: user.display_name,
    playing_style: user.playing_style,
    interests: user.interests,
    bio: user.bio,
  };
}
