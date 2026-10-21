'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { formatPrice, STATUS_LABELS, type WishlistItem } from '@/shared/types';

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await api<{ items: WishlistItem[] }>('/api/v1/wishlist');
    if (res.ok && res.data) setItems(res.data.items);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(listingId: string) {
    await api(`/api/v1/wishlist/${listingId}`, { method: 'DELETE' });
    await load();
  }

  if (loading) return <p className="text-gray-500">Loading…</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Wishlist</h1>
      {items.length === 0 ? (
        <p className="text-gray-500">Your wishlist is empty.</p>
      ) : (
        <div className="space-y-3">
          {items.map((i) => (
            <div key={i.listing_id} className="card flex flex-wrap items-center gap-4 p-4">
              {i.cover_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={i.cover_image_url} alt="" className="h-16 w-16 rounded object-cover" />
              ) : (
                <div className="h-16 w-16 rounded bg-gray-100" />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium">{i.title}</p>
                <p className="text-sm text-gray-600">{formatPrice(i.price)}</p>
              </div>
              {i.available ? (
                <Link href={`/listings/${i.listing_id}`} className="btn-secondary">View</Link>
              ) : (
                <span className="badge bg-red-100 text-red-700">Unavailable ({STATUS_LABELS[i.status]})</span>
              )}
              <button className="btn-danger" onClick={() => remove(i.listing_id)}>Remove</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
