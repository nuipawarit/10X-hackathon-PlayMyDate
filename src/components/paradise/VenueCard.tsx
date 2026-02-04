'use client';

import Link from 'next/link';
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
      <div className="card-hover h-full">
        <div className="aspect-video bg-gray-100 relative overflow-hidden rounded-t-2xl -mx-6 -mt-6 mb-4">
          {venue.photos && venue.photos.length > 0 ? (
            <img
              src={venue.photos[0]}
              alt={venue.name}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              No Image
            </div>
          )}
          {venue.rating && (
            <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-bold bg-white/90 backdrop-blur-sm shadow-lg text-amber-600">
              ⭐ {venue.rating}
            </span>
          )}
        </div>
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-lg text-gray-800 line-clamp-1">{venue.name}</h3>
            {priceRangeDisplay && (
              <span className="text-gray-400 text-sm shrink-0">
                {priceRangeDisplay}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs bg-primary-50 text-primary-600 px-2.5 py-1 rounded-full">{venue.venue_type}</span>
            {venue.cuisine_type && (
              <span className="text-xs bg-secondary-50 text-secondary-600 px-2.5 py-1 rounded-full">{venue.cuisine_type}</span>
            )}
          </div>
          {venue.description && (
            <p className="text-sm text-gray-500 line-clamp-2">
              {venue.description}
            </p>
          )}
          {venue.address && (
            <p className="text-xs text-gray-400 truncate">
              📍 {venue.address}
            </p>
          )}
          {venue.ambiance_tags && venue.ambiance_tags.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {venue.ambiance_tags.slice(0, 3).map((tag) => (
                <span key={tag} className="text-xs bg-accent-50 text-accent-600 px-2 py-0.5 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
