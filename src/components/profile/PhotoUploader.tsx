'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PhotoUploaderProps {
  currentPhotoUrl?: string | null;
  onSave: (url: string) => void;
  onDelete?: () => void;
}

export function PhotoUploader({ currentPhotoUrl, onSave, onDelete }: PhotoUploaderProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(currentPhotoUrl || null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      setError('Invalid file type. Allowed: JPEG, PNG, WebP, GIF');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File too large. Maximum size is 5MB');
      return;
    }

    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);

    await uploadPhoto(file);
  };

  const uploadPhoto = async (file: File) => {
    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('photo', file);

      const response = await fetch('/api/users/photo', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Upload failed');
      }

      const data = await response.json();
      setPhotoUrl(data.photoUrl);
      setPreviewUrl(null);
      onSave(data.photoUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload photo');
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete your photo?')) return;

    try {
      const response = await fetch('/api/users/photo', {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Delete failed');
      }

      setPhotoUrl(null);
      setPreviewUrl(null);
      onDelete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete photo');
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const displayUrl = previewUrl || photoUrl;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          Profile Photo
          <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded">
            Level 3 unlock
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
            {error}
          </div>
        )}

        <div className="flex items-center gap-4">
          <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-dashed border-muted-foreground/20">
            {displayUrl ? (
              <img
                src={displayUrl}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            )}
          </div>

          <div className="flex-1 space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="flex gap-2">
              <Button
                onClick={triggerFileInput}
                disabled={isUploading}
                variant={photoUrl ? 'outline' : 'default'}
                size="sm"
              >
                {isUploading ? 'Uploading...' : photoUrl ? 'Change Photo' : 'Upload Photo'}
              </Button>

              {photoUrl && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isUploading}
                >
                  Delete
                </Button>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              JPEG, PNG, WebP, or GIF. Max 5MB.
            </p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          Your photo will be revealed to matches when you reach intimacy level 3 (75%).
        </p>
      </CardContent>
    </Card>
  );
}
