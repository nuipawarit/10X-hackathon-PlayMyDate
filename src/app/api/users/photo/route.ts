import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';
import { uploadFile, deleteFile } from '@/lib/blob';
import { sql } from '@/lib/db';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      const formData = await request.formData();
      const photoFile = formData.get('photo') as File | null;

      if (!photoFile) {
        return NextResponse.json({ error: 'Photo file is required' }, { status: 400 });
      }

      if (!ALLOWED_TYPES.includes(photoFile.type)) {
        return NextResponse.json(
          { error: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF' },
          { status: 400 }
        );
      }

      if (photoFile.size > MAX_SIZE) {
        return NextResponse.json(
          { error: 'File too large. Maximum size is 5MB' },
          { status: 400 }
        );
      }

      const arrayBuffer = await photoFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const existingUser = await sql`
        SELECT photo_url FROM users WHERE id = ${userId}
      `;

      if (existingUser.rows[0]?.photo_url) {
        try {
          await deleteFile(existingUser.rows[0].photo_url);
        } catch {
          // Ignore errors when deleting old file
        }
      }

      const ext = photoFile.type.split('/')[1] || 'jpg';
      const path = `profile-photos/${userId}-${Date.now()}.${ext}`;
      const photoUrl = await uploadFile(path, buffer, photoFile.type);

      await sql`
        UPDATE users SET photo_url = ${photoUrl}, updated_at = NOW()
        WHERE id = ${userId}
      `;

      return NextResponse.json({ photoUrl });
    } catch (error) {
      console.error('Upload photo error:', error);
      return NextResponse.json({ error: 'Failed to upload photo' }, { status: 500 });
    }
  });
}

export async function DELETE(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      const userResult = await sql`
        SELECT photo_url FROM users WHERE id = ${userId}
      `;

      if (!userResult.rows[0]?.photo_url) {
        return NextResponse.json({ error: 'No photo found' }, { status: 404 });
      }

      await deleteFile(userResult.rows[0].photo_url);

      await sql`
        UPDATE users SET photo_url = NULL, updated_at = NOW()
        WHERE id = ${userId}
      `;

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Delete photo error:', error);
      return NextResponse.json({ error: 'Failed to delete photo' }, { status: 500 });
    }
  });
}
