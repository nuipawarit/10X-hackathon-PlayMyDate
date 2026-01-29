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
  },
  {
    email: 'bob@demo.com',
    password: 'password123',
    display_name: 'Bob',
    playing_style: ['competitive', 'strategic'],
    interests: ['gaming', 'tech', 'movies'],
    bio: 'Gamer and tech enthusiast looking for meaningful connections.',
  },
  {
    email: 'charlie@demo.com',
    password: 'password123',
    display_name: 'Charlie',
    playing_style: ['casual', 'social'],
    interests: ['music', 'art', 'hiking'],
    bio: 'Artist who loves nature and good conversations.',
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

    for (const user of DEMO_USERS) {
      const { data: existingUsers } = await supabaseAdmin
        .from('profiles')
        .select('email')
        .eq('email', user.email);

      if (existingUsers && existingUsers.length > 0) {
        results.push({ email: user.email, status: 'skipped', reason: 'already exists' });
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

      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({
          playing_style: user.playing_style,
          interests: user.interests,
          bio: user.bio,
        })
        .eq('auth_id', authData.user.id);

      if (profileError) {
        results.push({ email: user.email, status: 'partial', reason: profileError.message });
      } else {
        results.push({ email: user.email, status: 'created' });
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
