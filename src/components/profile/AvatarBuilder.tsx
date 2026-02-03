'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { AvatarConfig } from '@/lib/db';

const STYLES = ['cartoon', 'realistic', 'pixel'] as const;
const HAIR_COLORS = ['#2C1810', '#4A3728', '#8B4513', '#FFD700', '#FF6B35', '#1a1a1a', '#f5f5f5'];
const HAIR_STYLES = ['short', 'medium', 'long', 'curly', 'wavy', 'bald'];
const SKIN_TONES = ['#FFDBB4', '#EDB98A', '#D08B5B', '#AE5D29', '#614335', '#3B2219'];
const BACKGROUNDS = ['#E8F5E9', '#E3F2FD', '#FFF3E0', '#FCE4EC', '#F3E5F5', '#E0F7FA'];
const ACCESSORIES = ['glasses', 'earrings', 'hat', 'headphones', 'necklace', 'none'];

interface AvatarBuilderProps {
  initialConfig?: AvatarConfig | null;
  onSave: (config: AvatarConfig) => Promise<void>;
  onCancel?: () => void;
}

export default function AvatarBuilder({ initialConfig, onSave, onCancel }: AvatarBuilderProps) {
  const [config, setConfig] = useState<AvatarConfig>(
    initialConfig || {
      style: 'cartoon',
      hairColor: HAIR_COLORS[0],
      hairStyle: HAIR_STYLES[0],
      skinTone: SKIN_TONES[0],
      accessories: [],
      background: BACKGROUNDS[0],
    }
  );
  const [saving, setSaving] = useState(false);

  const handleStyleChange = (style: AvatarConfig['style']) => {
    setConfig((prev) => ({ ...prev, style }));
  };

  const handleHairColorChange = (color: string) => {
    setConfig((prev) => ({ ...prev, hairColor: color }));
  };

  const handleHairStyleChange = (style: string) => {
    setConfig((prev) => ({ ...prev, hairStyle: style }));
  };

  const handleSkinToneChange = (tone: string) => {
    setConfig((prev) => ({ ...prev, skinTone: tone }));
  };

  const handleBackgroundChange = (bg: string) => {
    setConfig((prev) => ({ ...prev, background: bg }));
  };

  const handleAccessoryToggle = (accessory: string) => {
    if (accessory === 'none') {
      setConfig((prev) => ({ ...prev, accessories: [] }));
      return;
    }
    setConfig((prev) => ({
      ...prev,
      accessories: prev.accessories.includes(accessory)
        ? prev.accessories.filter((a) => a !== accessory)
        : [...prev.accessories, accessory],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(config);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Avatar Builder</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-center">
          <div
            className="w-32 h-32 rounded-full border-4 border-primary flex items-center justify-center text-4xl"
            style={{ backgroundColor: config.background }}
          >
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center"
              style={{ backgroundColor: config.skinTone }}
            >
              <span className="text-2xl">
                {config.style === 'cartoon' ? '😊' : config.style === 'realistic' ? '🧑' : '🎮'}
              </span>
            </div>
          </div>
        </div>

        <Tabs defaultValue="style" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="style">Style</TabsTrigger>
            <TabsTrigger value="hair">Hair</TabsTrigger>
            <TabsTrigger value="skin">Skin</TabsTrigger>
            <TabsTrigger value="accessories">Acc.</TabsTrigger>
            <TabsTrigger value="background">BG</TabsTrigger>
          </TabsList>

          <TabsContent value="style" className="space-y-4">
            <p className="text-sm text-muted-foreground">Choose your avatar style</p>
            <div className="flex gap-2">
              {STYLES.map((style) => (
                <Button
                  key={style}
                  variant={config.style === style ? 'default' : 'outline'}
                  onClick={() => handleStyleChange(style)}
                  className="flex-1 capitalize"
                >
                  {style}
                </Button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="hair" className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Hair Color</p>
              <div className="flex gap-2 flex-wrap">
                {HAIR_COLORS.map((color) => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded-full border-2 ${
                      config.hairColor === color ? 'border-primary ring-2 ring-primary' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => handleHairColorChange(color)}
                  />
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Hair Style</p>
              <div className="flex gap-2 flex-wrap">
                {HAIR_STYLES.map((style) => (
                  <Button
                    key={style}
                    variant={config.hairStyle === style ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleHairStyleChange(style)}
                    className="capitalize"
                  >
                    {style}
                  </Button>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="skin" className="space-y-4">
            <p className="text-sm text-muted-foreground">Skin Tone</p>
            <div className="flex gap-2 flex-wrap">
              {SKIN_TONES.map((tone) => (
                <button
                  key={tone}
                  className={`w-10 h-10 rounded-full border-2 ${
                    config.skinTone === tone ? 'border-primary ring-2 ring-primary' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: tone }}
                  onClick={() => handleSkinToneChange(tone)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="accessories" className="space-y-4">
            <p className="text-sm text-muted-foreground">Accessories (select multiple)</p>
            <div className="flex gap-2 flex-wrap">
              {ACCESSORIES.map((acc) => (
                <Button
                  key={acc}
                  variant={
                    acc === 'none'
                      ? config.accessories.length === 0
                        ? 'default'
                        : 'outline'
                      : config.accessories.includes(acc)
                        ? 'default'
                        : 'outline'
                  }
                  size="sm"
                  onClick={() => handleAccessoryToggle(acc)}
                  className="capitalize"
                >
                  {acc}
                </Button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="background" className="space-y-4">
            <p className="text-sm text-muted-foreground">Background Color</p>
            <div className="flex gap-2 flex-wrap">
              {BACKGROUNDS.map((bg) => (
                <button
                  key={bg}
                  className={`w-10 h-10 rounded border-2 ${
                    config.background === bg ? 'border-primary ring-2 ring-primary' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: bg }}
                  onClick={() => handleBackgroundChange(bg)}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-2 pt-4">
          {onCancel && (
            <Button variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
          )}
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            {saving ? 'Saving...' : 'Save Avatar'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
