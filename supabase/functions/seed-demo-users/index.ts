import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DEMO_USERS = [
  {
    email: 'alice@demo.com',
    password: 'password123',
    display_name: 'Alice',
    playing_style: ['casual', 'creative'],
    interests: ['music', 'travel', 'cooking'],
    bio: 'Love exploring new places and trying new recipes!',
    real_name: 'Alice Smith',
    occupation: 'UX Designer',
  },
  {
    email: 'bob@demo.com',
    password: 'password123',
    display_name: 'Bob',
    playing_style: ['competitive', 'strategic'],
    interests: ['gaming', 'tech', 'movies'],
    bio: 'Gamer and tech enthusiast looking for meaningful connections.',
    real_name: 'Bob Johnson',
    occupation: 'Software Engineer',
  },
  {
    email: 'charlie@demo.com',
    password: 'password123',
    display_name: 'Charlie',
    playing_style: ['casual', 'social'],
    interests: ['music', 'art', 'hiking'],
    bio: 'Artist who loves nature and good conversations.',
    real_name: 'Charlie Brown',
    occupation: 'Graphic Designer',
  },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const results = [];
    const profileIds: Record<string, string> = {};

    // Step 1: Create users
    for (const user of DEMO_USERS) {
      const { data: existingUsers } = await supabaseAdmin
        .from('profiles')
        .select('id, email')
        .eq('email', user.email);

      if (existingUsers && existingUsers.length > 0) {
        profileIds[user.email] = existingUsers[0].id;
        results.push({ email: user.email, status: 'exists', profileId: existingUsers[0].id });
        continue;
      }

      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: { display_name: user.display_name },
      });

      if (authError) {
        results.push({ email: user.email, status: 'error', reason: authError.message });
        continue;
      }

      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({
          playing_style: user.playing_style,
          interests: user.interests,
          bio: user.bio,
          real_name: user.real_name,
          occupation: user.occupation,
        })
        .eq('auth_id', authData.user.id)
        .select('id')
        .single();

      if (profileError) {
        results.push({ email: user.email, status: 'partial', reason: profileError.message });
      } else {
        profileIds[user.email] = profile.id;
        results.push({ email: user.email, status: 'created', profileId: profile.id });
      }
    }

    // Step 2: Create matches (if all users exist)
    const aliceId = profileIds['alice@demo.com'];
    const bobId = profileIds['bob@demo.com'];
    const charlieId = profileIds['charlie@demo.com'];

    if (aliceId && bobId && charlieId) {
      // Check if matches already exist
      const { data: existingMatches } = await supabaseAdmin
        .from('matches')
        .select('id')
        .or(`and(user1_id.eq.${aliceId},user2_id.eq.${bobId}),and(user1_id.eq.${bobId},user2_id.eq.${aliceId})`);

      if (!existingMatches || existingMatches.length === 0) {
        // Alice <-> Bob match
        const { data: match1, error: match1Error } = await supabaseAdmin
          .from('matches')
          .insert({
            user1_id: aliceId,
            user2_id: bobId,
            compatibility_score: 85,
            status: 'matched',
          })
          .select('id')
          .single();

        if (match1 && !match1Error) {
          // Create intimacy score for Alice-Bob
          await supabaseAdmin
            .from('intimacy_scores')
            .insert({
              match_id: match1.id,
              score: 50,
              unlocks: ['real_name', 'photo'],
            });

          // Create sample messages
          await supabaseAdmin
            .from('messages')
            .insert([
              { match_id: match1.id, sender_id: aliceId, content: 'Hey! Nice to match with you 😊' },
              { match_id: match1.id, sender_id: bobId, content: 'Hi Alice! Love your profile, cooking is awesome!' },
              { match_id: match1.id, sender_id: aliceId, content: 'Thanks! What games do you play?' },
              { match_id: match1.id, sender_id: bobId, content: 'Mostly strategy games and some FPS. Do you game at all?' },
            ]);

          results.push({ type: 'match', users: 'alice-bob', status: 'created' });
        }
      } else {
        results.push({ type: 'match', users: 'alice-bob', status: 'exists' });
      }

      // Bob <-> Charlie match
      const { data: existingMatch2 } = await supabaseAdmin
        .from('matches')
        .select('id')
        .or(`and(user1_id.eq.${bobId},user2_id.eq.${charlieId}),and(user1_id.eq.${charlieId},user2_id.eq.${bobId})`);

      if (!existingMatch2 || existingMatch2.length === 0) {
        const { data: match2, error: match2Error } = await supabaseAdmin
          .from('matches')
          .insert({
            user1_id: bobId,
            user2_id: charlieId,
            compatibility_score: 72,
            status: 'matched',
          })
          .select('id')
          .single();

        if (match2 && !match2Error) {
          // Create intimacy score for Bob-Charlie
          await supabaseAdmin
            .from('intimacy_scores')
            .insert({
              match_id: match2.id,
              score: 30,
              unlocks: ['real_name'],
            });

          // Create sample messages
          await supabaseAdmin
            .from('messages')
            .insert([
              { match_id: match2.id, sender_id: bobId, content: 'Hey Charlie! I see you like hiking too!' },
              { match_id: match2.id, sender_id: charlieId, content: 'Yeah! I try to go every weekend. Any favorite trails?' },
            ]);

          results.push({ type: 'match', users: 'bob-charlie', status: 'created' });
        }
      } else {
        results.push({ type: 'match', users: 'bob-charlie', status: 'exists' });
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
