import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { getSupabaseAdmin, getCurrentProfile } from '../_shared/supabase-client.ts';

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

    const { instanceId, result } = await req.json();

    if (!instanceId) {
      return new Response(JSON.stringify({ error: 'Instance ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { data: instance, error: instanceError } = await supabaseAdmin
      .from('activity_instances')
      .select('*, activities(*)')
      .eq('id', instanceId)
      .single();

    if (instanceError || !instance) {
      return new Response(JSON.stringify({ error: 'Activity instance not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: match, error: matchError } = await supabaseAdmin
      .from('matches')
      .select('*')
      .eq('id', instance.match_id)
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

    const { data: completedInstance, error: updateError } = await supabaseAdmin
      .from('activity_instances')
      .update({
        status: 'completed',
        result: result || {},
        completed_at: new Date().toISOString(),
      })
      .eq('id', instanceId)
      .select()
      .single();

    if (updateError) {
      return new Response(JSON.stringify({ error: 'Failed to complete activity' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ instance: completedInstance }), {
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
