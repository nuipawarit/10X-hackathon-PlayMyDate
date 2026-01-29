import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { withAuth } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  return withAuth(request, async () => {
    try {
      const activitiesResult = await sql`
        SELECT * FROM activities ORDER BY intimacy_points ASC
      `;
      return NextResponse.json({ activities: activitiesResult.rows });
    } catch (error) {
      console.error('Get activities error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}
