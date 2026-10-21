'use client';

import Link from 'next/link';
import { CONDITION_LABELS, formatPrice, type ListingSummary } from '@/shared/types';

export function ListingCard({ listing }: { listing: ListingSummary }) {
  const cover = listing.images[0]?.url;
  return (
    <Link href={`/listings/${listing.id}`} className="card block overflow-hidden hover:shadow-md transition-shadow">
      <div className="aspect-square w-full bg-gray-100">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt={listing.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">No image</div>
        )}
      </div>
      <div className="p-3 space-y-1">
        <p className="text-sm font-medium text-gray-900 line-clamp-2">{listing.title}</p>
        <p className="text-lg font-bold text-gray-900">{formatPrice(listing.price)}</p>
        <div className="flex items-center gap-2">
          <span className="badge bg-brand-50 text-brand-700">{CONDITION_LABELS[listing.condition]}</span>
          <span className="badge bg-gray-100 text-gray-600">{listing.category.name}</span>
        </div>
        <p className="text-xs text-gray-500">Sold by {listing.seller.display_name}</p>
      </div>
    </Link>
  );
}
