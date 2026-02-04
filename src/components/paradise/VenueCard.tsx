'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { DateVenue } from '@/lib/services/venue';

interface VenueCardProps {
  venue: DateVenue;
}

export function VenueCard({ venue }: VenueCardProps) {
  const priceRangeDisplay = venue.price_range
    ? '฿'.repeat(venue.price_range)
    : null;

  return (
    <Link href={`/dates/venues/${venue.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
        <div className="aspect-video bg-muted relative overflow-hidden rounded-t-lg">
          {venue.photos && venue.photos.length > 0 ? (
            <img
              src={venue.photos[0]}
              alt={venue.name}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              No Image
            </div>
          )}
          {venue.rating && (
            <Badge className="absolute top-2 right-2" variant="secondary">
              ⭐ {venue.rating}
            </Badge>
          )}
        </div>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-lg line-clamp-1">{venue.name}</h3>
            {priceRangeDisplay && (
              <span className="text-muted-foreground text-sm shrink-0">
                {priceRangeDisplay}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline">{venue.venue_type}</Badge>
            {venue.cuisine_type && (
              <Badge variant="outline">{venue.cuisine_type}</Badge>
            )}
          </div>
          {venue.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {venue.description}
            </p>
          )}
          {venue.address && (
            <p className="text-xs text-muted-foreground truncate">
              📍 {venue.address}
            </p>
          )}
          {venue.ambiance_tags && venue.ambiance_tags.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {venue.ambiance_tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
