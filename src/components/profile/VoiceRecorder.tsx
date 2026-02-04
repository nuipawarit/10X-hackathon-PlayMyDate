'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface VoiceRecorderProps {
  currentVoiceNoteUrl?: string | null;
  onSave: (url: string) => void;
  onDelete?: () => void;
}

export function VoiceRecorder({ currentVoiceNoteUrl, onSave, onDelete }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(currentVoiceNoteUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);

        stream.getTracks().forEach((track) => track.stop());
        await uploadAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Failed to access microphone. Please check your permissions.');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isRecording]);

  const uploadAudio = async (audioBlob: Blob) => {
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'voice-note.webm');

      const response = await fetch('/api/users/voice-note', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      onSave(data.voiceNoteUrl);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload voice note. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch('/api/users/voice-note', {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Delete failed');
      }

      setAudioUrl(null);
      onDelete?.();
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete voice note. Please try again.');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Voice Note</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {audioUrl && !isRecording && (
          <div className="space-y-2">
            <audio src={audioUrl} controls className="w-full" />
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              Delete Voice Note
            </Button>
          </div>
        )}

        {isRecording && (
          <div className="text-center py-4">
            <div className="text-2xl font-mono text-red-500 animate-pulse">
              Recording {formatTime(recordingTime)}
            </div>
          </div>
        )}

        {isUploading && (
          <div className="text-center py-4 text-muted-foreground">
            Uploading...
          </div>
        )}

        <div className="flex gap-2">
          {!isRecording ? (
            <Button onClick={startRecording} disabled={isUploading}>
              {audioUrl ? 'Record New' : 'Start Recording'}
            </Button>
          ) : (
            <Button variant="destructive" onClick={stopRecording}>
              Stop Recording
            </Button>
          )}
        </div>

        <p className="text-sm text-muted-foreground">
          Record a short voice note to introduce yourself. Max 60 seconds.
        </p>
      </CardContent>
    </Card>
  );
}
