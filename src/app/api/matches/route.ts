import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { withAuth } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      const matchesResult = await sql`
        SELECT
          m.*,
          CASE WHEN m.user1_id = ${userId} THEN u2.id ELSE u1.id END as partner_id,
          CASE WHEN m.user1_id = ${userId} THEN u2.display_name ELSE u1.display_name END as partner_display_name,
          CASE WHEN m.user1_id = ${userId} THEN u2.playing_style ELSE u1.playing_style END as partner_playing_style,
          CASE WHEN m.user1_id = ${userId} THEN u2.interests ELSE u1.interests END as partner_interests,
          CASE WHEN m.user1_id = ${userId} THEN u2.bio ELSE u1.bio END as partner_bio
        FROM matches m
        JOIN users u1 ON m.user1_id = u1.id
        JOIN users u2 ON m.user2_id = u2.id
        WHERE (m.user1_id = ${userId} OR m.user2_id = ${userId})
          AND m.status = 'matched'
        ORDER BY m.created_at DESC
      `;

      const matches = matchesResult.rows.map((row) => ({
        id: row.id,
        user1_id: row.user1_id,
        user2_id: row.user2_id,
        compatibility_score: row.compatibility_score,
        status: row.status,
        chemistry_score: row.chemistry_score,
        paradise_mode_unlocked: row.paradise_mode_unlocked,
        created_at: row.created_at,
        updated_at: row.updated_at,
        partner: {
          id: row.partner_id,
          display_name: row.partner_display_name,
          playing_style: row.partner_playing_style,
          interests: row.partner_interests,
          bio: row.partner_bio,
        },
      }));

      return NextResponse.json({ matches });
    } catch (error) {
      console.error('Get matches error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}
