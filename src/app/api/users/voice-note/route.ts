import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';
import { uploadVoiceNote, deleteVoiceNote } from '@/lib/blob';
import { sql } from '@/lib/db';

export async function POST(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      const formData = await request.formData();
      const audioFile = formData.get('audio') as File | null;

      if (!audioFile) {
        return NextResponse.json({ error: 'Audio file is required' }, { status: 400 });
      }

      const arrayBuffer = await audioFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const existingUser = await sql`
        SELECT voice_note_url FROM users WHERE id = ${userId}
      `;

      if (existingUser.rows[0]?.voice_note_url) {
        try {
          await deleteVoiceNote(existingUser.rows[0].voice_note_url);
        } catch {
          // Ignore errors when deleting old file
        }
      }

      const voiceNoteUrl = await uploadVoiceNote(userId, buffer);

      await sql`
        UPDATE users SET voice_note_url = ${voiceNoteUrl}, updated_at = NOW()
        WHERE id = ${userId}
      `;

      return NextResponse.json({ voiceNoteUrl });
    } catch (error) {
      console.error('Upload voice note error:', error);
      return NextResponse.json({ error: 'Failed to upload voice note' }, { status: 500 });
    }
  });
}

export async function DELETE(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      const userResult = await sql`
        SELECT voice_note_url FROM users WHERE id = ${userId}
      `;

      if (!userResult.rows[0]?.voice_note_url) {
        return NextResponse.json({ error: 'No voice note found' }, { status: 404 });
      }

      await deleteVoiceNote(userResult.rows[0].voice_note_url);

      await sql`
        UPDATE users SET voice_note_url = NULL, updated_at = NOW()
        WHERE id = ${userId}
      `;

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Delete voice note error:', error);
      return NextResponse.json({ error: 'Failed to delete voice note' }, { status: 500 });
    }
  });
}
