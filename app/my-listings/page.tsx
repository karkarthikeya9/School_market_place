'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { formatPrice, STATUS_LABELS, type ListingSummary, type Paginated } from '@/shared/types';

export default function MyListingsPage() {
  const [listings, setListings] = useState<ListingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    const res = await api<Paginated<ListingSummary>>('/api/v1/me/listings');
    if (res.ok && res.data) setListings(res.data.items);
    else setError(res.error ?? 'Failed to load');
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function act(id: string, path: string, method = 'POST') {
    const res = await api(path, { method });
    if (res.ok) await load();
    else setError(res.error ?? 'Action failed');
  }

  const statusColor: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600',
    active: 'bg-green-100 text-green-700',
    sold: 'bg-red-100 text-red-700',
    inactive: 'bg-amber-100 text-amber-700',
    removed: 'bg-gray-100 text-gray-500',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My listings</h1>
        <Link href="/sell" className="btn-primary">Sell an item</Link>
      </div>
      {error && <p className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>}
      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : listings.length === 0 ? (
        <p className="text-gray-500">You have no listings yet.</p>
      ) : (
        <div className="space-y-3">
          {listings.map((l) => (
            <div key={l.id} className="card flex flex-wrap items-center gap-4 p-4">
              {l.images[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={l.images[0].url} alt="" className="h-16 w-16 rounded object-cover" />
              ) : (
                <div className="h-16 w-16 rounded bg-gray-100" />
              )}
              <div className="min-w-0 flex-1">
                <Link href={`/listings/${l.id}`} className="font-medium hover:underline">
                  {l.title}
                </Link>
                <p className="text-sm text-gray-600">
                  {formatPrice(l.price)} · {l.category.name}
                </p>
              </div>
              <span className={`badge ${statusColor[l.status] ?? 'bg-gray-100 text-gray-600'}`}>
                {STATUS_LABELS[l.status]}
              </span>
              <div className="flex flex-wrap gap-2">
                {l.status === 'draft' && (
                  <button className="btn-primary" onClick={() => act(l.id, `/api/v1/listings/${l.id}/publish`)}>
                    Publish
                  </button>
                )}
                {l.status === 'active' && (
                  <button className="btn-primary" onClick={() => act(l.id, `/api/v1/listings/${l.id}/mark-sold`)}>
                    Mark sold
                  </button>
                )}
                {l.status === 'active' && (
                  <button className="btn-secondary" onClick={() => act(l.id, `/api/v1/listings/${l.id}/deactivate`)}>
                    Deactivate
                  </button>
                )}
                {l.status === 'inactive' && (
                  <button className="btn-primary" onClick={() => act(l.id, `/api/v1/listings/${l.id}/reactivate`)}>
                    Reactivate
                  </button>
                )}
                {l.status !== 'sold' && l.status !== 'removed' && (
                  <Link href={`/listings/${l.id}/edit`} className="btn-secondary">Edit</Link>
                )}
                {l.status !== 'sold' && l.status !== 'removed' && (
                  <button className="btn-danger" onClick={() => act(l.id, `/api/v1/listings/${l.id}`, 'DELETE')}>
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
