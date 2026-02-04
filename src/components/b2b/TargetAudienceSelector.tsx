'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface TargetAudience {
  ageRange?: { min: number; max: number };
  interests?: string[];
  playingStyles?: string[];
  personas?: string[];
}

interface TargetAudienceSelectorProps {
  value: TargetAudience | Record<string, unknown>;
  onChange: (audience: TargetAudience) => void;
}

const INTERESTS = [
  'movies', 'music', 'gaming', 'coffee', 'hiking', 'photography',
  'travel', 'food', 'art', 'reading', 'fitness', 'cooking'
];

const PLAYING_STYLES = [
  'adventurous', 'chill', 'spontaneous', 'creative', 'competitive', 'romantic'
];

const PERSONAS = [
  { id: 'explorer', label: 'Explorer', desc: 'Seeks new experiences' },
  { id: 'connector', label: 'Connector', desc: 'Values relationships' },
  { id: 'achiever', label: 'Achiever', desc: 'Goal-oriented' },
  { id: 'premium', label: 'Premium', desc: 'High value user' },
  { id: 'casual', label: 'Casual', desc: 'Relaxed approach' },
];

export function TargetAudienceSelector({ value: rawValue, onChange }: TargetAudienceSelectorProps) {
  const [expanded, setExpanded] = useState(false);
  const value = rawValue as TargetAudience;

  const toggleInterest = (interest: string) => {
    const current = value.interests || [];
    const newInterests = current.includes(interest)
      ? current.filter(i => i !== interest)
      : [...current, interest];
    onChange({ ...value, interests: newInterests });
  };

  const togglePlayingStyle = (style: string) => {
    const current = value.playingStyles || [];
    const newStyles = current.includes(style)
      ? current.filter(s => s !== style)
      : [...current, style];
    onChange({ ...value, playingStyles: newStyles });
  };

  const togglePersona = (persona: string) => {
    const current = value.personas || [];
    const newPersonas = current.includes(persona)
      ? current.filter(p => p !== persona)
      : [...current, persona];
    onChange({ ...value, personas: newPersonas });
  };

  const setAgeRange = (min?: number, max?: number) => {
    if (min !== undefined || max !== undefined) {
      onChange({
        ...value,
        ageRange: {
          min: min ?? value.ageRange?.min ?? 18,
          max: max ?? value.ageRange?.max ?? 65,
        }
      });
    }
  };

  const hasTargeting = (value.interests?.length || 0) > 0 ||
    (value.playingStyles?.length || 0) > 0 ||
    (value.personas?.length || 0) > 0 ||
    value.ageRange;

  if (!expanded) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Target Audience</Label>
          <Button type="button" variant="outline" size="sm" onClick={() => setExpanded(true)}>
            {hasTargeting ? 'Edit Targeting' : 'Add Targeting'}
          </Button>
        </div>
        {hasTargeting && (
          <div className="flex flex-wrap gap-1">
            {value.ageRange && (
              <Badge variant="secondary">Age {value.ageRange.min}-{value.ageRange.max}</Badge>
            )}
            {value.interests?.map(i => (
              <Badge key={i} variant="outline">{i}</Badge>
            ))}
            {value.playingStyles?.map(s => (
              <Badge key={s} variant="outline">{s}</Badge>
            ))}
            {value.personas?.map(p => (
              <Badge key={p} variant="outline">{p}</Badge>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Target Audience</CardTitle>
          <Button type="button" variant="ghost" size="sm" onClick={() => setExpanded(false)}>
            Done
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label>Age Range</Label>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              placeholder="Min"
              min={18}
              max={99}
              value={value.ageRange?.min || ''}
              onChange={(e) => setAgeRange(parseInt(e.target.value) || undefined, undefined)}
              className="w-24"
            />
            <span className="text-muted-foreground">to</span>
            <Input
              type="number"
              placeholder="Max"
              min={18}
              max={99}
              value={value.ageRange?.max || ''}
              onChange={(e) => setAgeRange(undefined, parseInt(e.target.value) || undefined)}
              className="w-24"
            />
          </div>
        </div>

        <div className="space-y-3">
          <Label>Interests</Label>
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map(interest => (
              <Badge
                key={interest}
                variant={value.interests?.includes(interest) ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => toggleInterest(interest)}
              >
                {interest}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Label>Playing Styles</Label>
          <div className="flex flex-wrap gap-2">
            {PLAYING_STYLES.map(style => (
              <Badge
                key={style}
                variant={value.playingStyles?.includes(style) ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => togglePlayingStyle(style)}
              >
                {style}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Label>User Personas</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {PERSONAS.map(persona => (
              <div
                key={persona.id}
                onClick={() => togglePersona(persona.id)}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  value.personas?.includes(persona.id)
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <p className="font-medium text-sm">{persona.label}</p>
                <p className="text-xs text-muted-foreground">{persona.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
