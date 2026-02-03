import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';
import { sql, type AvatarConfig } from '@/lib/db';

export async function GET(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      const result = await sql`
        SELECT avatar_config FROM users WHERE id = ${userId}
      `;

      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      return NextResponse.json({
        avatarConfig: result.rows[0].avatar_config as AvatarConfig | null,
      });
    } catch (error) {
      console.error('Get avatar error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      const body = await request.json();
      const { avatarConfig } = body;

      if (!avatarConfig) {
        return NextResponse.json({ error: 'avatarConfig is required' }, { status: 400 });
      }

      const validStyles = ['cartoon', 'realistic', 'pixel'];
      if (!validStyles.includes(avatarConfig.style)) {
        return NextResponse.json(
          { error: 'Invalid avatar style. Must be one of: cartoon, realistic, pixel' },
          { status: 400 }
        );
      }

      const result = await sql`
        UPDATE users
        SET avatar_config = ${JSON.stringify(avatarConfig)}::jsonb,
            updated_at = NOW()
        WHERE id = ${userId}
        RETURNING avatar_config
      `;

      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      return NextResponse.json({
        avatarConfig: result.rows[0].avatar_config as AvatarConfig,
      });
    } catch (error) {
      console.error('Update avatar error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}
