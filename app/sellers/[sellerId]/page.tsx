'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api-client';
import { ListingCard } from '@/components/ListingCard';
import type { ListingSummary, Paginated, SellerPublic } from '@/shared/types';

export default function SellerProfilePage() {
  const params = useParams<{ sellerId: string }>();
  const [seller, setSeller] = useState<SellerPublic | null>(null);
  const [listings, setListings] = useState<ListingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    api<SellerPublic>(`/api/v1/sellers/${params.sellerId}`).then((res) => {
      if (res.ok && res.data) setSeller(res.data);
      else if (res.status === 404) setNotFound(true);
      setLoading(false);
    });
    api<Paginated<ListingSummary>>(`/api/v1/sellers/${params.sellerId}/listings`).then((res) => {
      if (res.ok && res.data) setListings(res.data.items);
    });
  }, [params.sellerId]);

  if (loading) return <p className="text-gray-500">Loading…</p>;
  if (notFound || !seller) {
    return (
      <div className="py-20 text-center">
        <h1 className="text-2xl font-bold">Seller not found</h1>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card flex items-center gap-4 p-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-xl font-bold text-brand-700">
          {seller.display_name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-xl font-bold">{seller.display_name}</h1>
          {seller.university && <p className="text-sm text-gray-600">{seller.university.name}</p>}
          {seller.bio && <p className="mt-1 text-sm text-gray-600">{seller.bio}</p>}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold">Active listings ({seller.active_listing_count})</h2>
        {listings.length === 0 ? (
          <p className="mt-3 text-gray-500">This seller has no active listings.</p>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {listings.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
