import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { withAuth } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      const userResult = await sql`
        SELECT id, email, display_name, playing_style, interests, bio,
               real_name, photo_url, occupation, phone, created_at, updated_at
        FROM users
        WHERE id = ${userId}
      `;

      if (userResult.rows.length === 0) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
      }

      return NextResponse.json({ profile: userResult.rows[0] });
    } catch (error) {
      console.error('Get profile error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}

export async function PUT(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      const { displayName, playingStyle, interests, bio, realName, photoUrl, occupation, phone } =
        await request.json();

      const updatedUserResult = await sql`
        UPDATE users
        SET
          display_name = COALESCE(${displayName}, display_name),
          playing_style = COALESCE(${playingStyle ? JSON.stringify(playingStyle) : null}, playing_style),
          interests = COALESCE(${interests ? JSON.stringify(interests) : null}, interests),
          bio = COALESCE(${bio}, bio),
          real_name = COALESCE(${realName}, real_name),
          photo_url = COALESCE(${photoUrl}, photo_url),
          occupation = COALESCE(${occupation}, occupation),
          phone = COALESCE(${phone}, phone),
          updated_at = NOW()
        WHERE id = ${userId}
        RETURNING id, email, display_name, playing_style, interests, bio,
                  real_name, photo_url, occupation, phone, created_at, updated_at
      `;

      if (updatedUserResult.rows.length === 0) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
      }

      return NextResponse.json({ profile: updatedUserResult.rows[0] });
    } catch (error) {
      console.error('Update profile error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}
