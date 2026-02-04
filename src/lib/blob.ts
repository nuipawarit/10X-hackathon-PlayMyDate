import { put, del } from '@vercel/blob';

export async function uploadVoiceNote(userId: string, audioBuffer: Buffer): Promise<string> {
  const filename = `voice-notes/${userId}-${Date.now()}.webm`;

  const blob = await put(filename, audioBuffer, {
    access: 'public',
    contentType: 'audio/webm',
  });

  return blob.url;
}

export async function deleteVoiceNote(url: string): Promise<void> {
  await del(url);
}

export async function uploadFile(
  path: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  const blob = await put(path, buffer, {
    access: 'public',
    contentType,
  });

  return blob.url;
}

export async function deleteFile(url: string): Promise<void> {
  await del(url);
}
