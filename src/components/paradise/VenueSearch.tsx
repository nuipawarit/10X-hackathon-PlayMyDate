'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface VenueSearchProps {
  onSearch: (filters: VenueSearchFilters) => void;
}

export interface VenueSearchFilters {
  venueType?: string;
  priceRange?: number;
  cuisineType?: string;
  ambianceTag?: string;
}

const VENUE_TYPES = ['cafe', 'restaurant', 'bar', 'entertainment'];
const CUISINE_TYPES = ['cafe', 'thai', 'japanese', 'italian', 'korean', 'fine_dining', 'bar'];
const AMBIANCE_TAGS = ['romantic', 'quiet', 'cozy', 'fun', 'rooftop', 'garden', 'unique'];

export function VenueSearch({ onSearch }: VenueSearchProps) {
  const [venueType, setVenueType] = useState<string>('');
  const [priceRange, setPriceRange] = useState<string>('');
  const [cuisineType, setCuisineType] = useState<string>('');
  const [ambianceTag, setAmbianceTag] = useState<string>('');

  const handleSearch = () => {
    onSearch({
      venueType: venueType || undefined,
      priceRange: priceRange ? parseInt(priceRange) : undefined,
      cuisineType: cuisineType || undefined,
      ambianceTag: ambianceTag || undefined,
    });
  };

  const handleReset = () => {
    setVenueType('');
    setPriceRange('');
    setCuisineType('');
    setAmbianceTag('');
    onSearch({});
  };

  return (
    <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Select value={venueType} onValueChange={setVenueType}>
          <SelectTrigger>
            <SelectValue placeholder="Venue Type" />
          </SelectTrigger>
          <SelectContent>
            {VENUE_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={priceRange} onValueChange={setPriceRange}>
          <SelectTrigger>
            <SelectValue placeholder="Price Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">฿ Budget</SelectItem>
            <SelectItem value="2">฿฿ Moderate</SelectItem>
            <SelectItem value="3">฿฿฿ Upscale</SelectItem>
            <SelectItem value="4">฿฿฿฿ Fine Dining</SelectItem>
            <SelectItem value="5">฿฿฿฿฿ Luxury</SelectItem>
          </SelectContent>
        </Select>

        <Select value={cuisineType} onValueChange={setCuisineType}>
          <SelectTrigger>
            <SelectValue placeholder="Cuisine Type" />
          </SelectTrigger>
          <SelectContent>
            {CUISINE_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {type.replace('_', ' ').charAt(0).toUpperCase() + type.replace('_', ' ').slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={ambianceTag} onValueChange={setAmbianceTag}>
          <SelectTrigger>
            <SelectValue placeholder="Ambiance" />
          </SelectTrigger>
          <SelectContent>
            {AMBIANCE_TAGS.map((tag) => (
              <SelectItem key={tag} value={tag}>
                {tag.charAt(0).toUpperCase() + tag.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleSearch}>Search</Button>
        <Button variant="outline" onClick={handleReset}>
          Reset
        </Button>
      </div>
    </div>
  );
}
