'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { DateVenue } from '@/lib/services/venue';

interface VenueDetailProps {
  venue: DateVenue;
  onBook?: () => void;
}

export function VenueDetail({ venue, onBook }: VenueDetailProps) {
  const priceRangeDisplay = venue.price_range
    ? '฿'.repeat(venue.price_range)
    : 'Not specified';

  return (
    <div className="space-y-6">
      <div className="aspect-video bg-muted rounded-lg overflow-hidden">
        {venue.photos && venue.photos.length > 0 ? (
          <img
            src={venue.photos[0]}
            alt={venue.name}
            className="object-cover w-full h-full"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            No Image Available
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{venue.name}</h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge>{venue.venue_type}</Badge>
              {venue.cuisine_type && <Badge variant="outline">{venue.cuisine_type}</Badge>}
              {venue.rating && (
                <Badge variant="secondary">⭐ {venue.rating}</Badge>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold">{priceRangeDisplay}</div>
            <div className="text-sm text-muted-foreground">Price Range</div>
          </div>
        </div>

        {venue.description && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">About</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{venue.description}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {venue.address && (
              <div>
                <span className="font-medium">📍 Address:</span>
                <p className="text-muted-foreground">{venue.address}</p>
              </div>
            )}
            {venue.ambiance_tags && venue.ambiance_tags.length > 0 && (
              <div>
                <span className="font-medium">🎭 Ambiance:</span>
                <div className="flex gap-2 flex-wrap mt-1">
                  {venue.ambiance_tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {venue.opening_hours && (
              <div>
                <span className="font-medium">🕐 Opening Hours:</span>
                <div className="text-sm text-muted-foreground mt-1">
                  {Object.entries(venue.opening_hours).map(([day, hours]) => (
                    <div key={day}>
                      {day}: {hours.open} - {hours.close}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {venue.booking_enabled && onBook && (
          <Button onClick={onBook} size="lg" className="w-full">
            Book This Venue
          </Button>
        )}

        {!venue.booking_enabled && (
          <div className="text-center p-4 bg-muted rounded-lg">
            <p className="text-muted-foreground">
              Online booking not available for this venue
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
