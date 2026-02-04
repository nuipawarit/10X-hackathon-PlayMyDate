'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface QRScannerProps {
  onScan: (qrCode: string) => Promise<void>;
}

export function QRScanner({ onScan }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  }, []);

  const startCamera = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsScanning(true);
    } catch (err) {
      console.error('Camera error:', err);
      setError('Failed to access camera. Please check permissions or enter the code manually.');
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;

    setIsProcessing(true);
    setError(null);
    try {
      await onScan(manualCode.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Check-in failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📱 QR Check-in
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
            {error}
          </div>
        )}

        {isScanning ? (
          <div className="space-y-4">
            <div className="aspect-square bg-black rounded-lg overflow-hidden relative">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 border-2 border-white rounded-lg opacity-50" />
              </div>
            </div>
            <Button variant="outline" onClick={stopCamera} className="w-full">
              Stop Scanning
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Point your camera at the venue QR code
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <Button onClick={startCamera} className="w-full">
              Start Camera Scanner
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  or enter manually
                </span>
              </div>
            </div>

            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <Input
                placeholder="Enter venue code..."
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                disabled={isProcessing}
              />
              <Button type="submit" disabled={isProcessing || !manualCode.trim()}>
                {isProcessing ? 'Processing...' : 'Check-in'}
              </Button>
            </form>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Scan the QR code at the venue to earn PlayCoins! 🪙
        </p>
      </CardContent>
    </Card>
  );
}
