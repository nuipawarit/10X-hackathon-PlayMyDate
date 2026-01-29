import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { getSupabaseAdmin, getCurrentProfile } from '../_shared/supabase-client.ts';
import { INTIMACY_THRESHOLDS } from '../_shared/types.ts';

const VALID_UNLOCK_TYPES = ['real_name', 'photo', 'occupation', 'call'];

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

    const { profile, error: profileError } = await getCurrentProfile(authHeader);
    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: profileError || 'Profile not found' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { matchId, unlockType } = await req.json();

    if (!matchId || !unlockType) {
      return new Response(JSON.stringify({ error: 'Match ID and unlock type are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!VALID_UNLOCK_TYPES.includes(unlockType)) {
      return new Response(JSON.stringify({ error: 'Invalid unlock type' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { data: match, error: matchError } = await supabaseAdmin
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single();

    if (matchError || !match) {
      return new Response(JSON.stringify({ error: 'Match not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (match.user1_id !== profile.id && match.user2_id !== profile.id) {
      return new Response(JSON.stringify({ error: 'Not authorized' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: intimacy, error: intimacyError } = await supabaseAdmin
      .from('intimacy_scores')
      .select('*')
      .eq('match_id', matchId)
      .single();

    if (intimacyError || !intimacy) {
      return new Response(JSON.stringify({ error: 'Intimacy record not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const threshold = INTIMACY_THRESHOLDS[unlockType as keyof typeof INTIMACY_THRESHOLDS];
    if (intimacy.score < threshold) {
      return new Response(
        JSON.stringify({
          error: `Intimacy score too low. Need ${threshold}, have ${intimacy.score}`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (intimacy.unlocks.includes(unlockType)) {
      return new Response(JSON.stringify({ error: 'Already unlocked' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const newUnlocks = [...intimacy.unlocks, unlockType];

    const { data: updatedIntimacy, error: updateError } = await supabaseAdmin
      .from('intimacy_scores')
      .update({ unlocks: newUnlocks })
      .eq('match_id', matchId)
      .select()
      .single();

    if (updateError) {
      return new Response(JSON.stringify({ error: 'Failed to unlock' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const availableUnlocks = getAvailableUnlocks(updatedIntimacy.score, newUnlocks);

    return new Response(
      JSON.stringify({
        intimacy: updatedIntimacy,
        available_unlocks: availableUnlocks,
        thresholds: INTIMACY_THRESHOLDS,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

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
