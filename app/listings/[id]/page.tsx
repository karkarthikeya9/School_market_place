'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { useAuth } from '@/components/Providers';
import {
  CONDITION_LABELS,
  formatPrice,
  REPORT_REASONS,
  STATUS_LABELS,
  type Listing,
  type WishlistItem,
} from '@/shared/types';

export default function ListingDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const { user, refresh } = useAuth();

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [activeImage, setActiveImage] = useState(0);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState<string>(REPORT_REASONS[0]);
  const [reportNote, setReportNote] = useState('');

  useEffect(() => {
    api<Listing>(`/api/v1/listings/${id}`).then((res) => {
      if (res.ok && res.data) {
        setListing(res.data);
      } else if (res.status === 404) {
        setNotFound(true);
      } else {
        setMessage(res.error ?? 'Failed to load listing');
      }
      setLoading(false);
    });
    if (user) {
      api<{ items: WishlistItem[] }>('/api/v1/wishlist').then((res) => {
        if (res.ok && res.data) setSaved(res.data.items.some((i) => i.listing_id === id));
      });
    }
  }, [id, user]);

  async function save() {
    setBusy(true);
    const res = await api('/api/v1/wishlist', { method: 'POST', body: JSON.stringify({ listing_id: id }) });
    setBusy(false);
    if (res.ok) setSaved(true);
    else setMessage(res.error ?? 'Could not save item');
  }

  async function removeFromWishlist() {
    setBusy(true);
    const res = await api(`/api/v1/wishlist/${id}`, { method: 'DELETE' });
    setBusy(false);
    if (res.ok) setSaved(false);
    else setMessage(res.error ?? 'Could not update');
  }

  async function contactSeller() {
    setBusy(true);
    const res = await api<{ id: string }>('/api/v1/conversations', {
      method: 'POST',
      body: JSON.stringify({ listing_id: id }),
    });
    setBusy(false);
    if (res.ok && res.data) router.push(`/messages/${res.data.id}`);
    else setMessage(res.error ?? 'Could not start conversation');
  }

  async function action(path: string, method = 'POST') {
    setBusy(true);
    const res = await api<Listing>(path, { method });
    setBusy(false);
    if (res.ok && res.data) setListing(res.data);
    else setMessage(res.error ?? 'Action failed');
  }

  async function submitReport() {
    setBusy(true);
    const res = await api('/api/v1/reports', {
      method: 'POST',
      body: JSON.stringify({ listing_id: id, reason: reportReason, note: reportNote }),
    });
    setBusy(false);
    if (res.ok) {
      setShowReport(false);
      setMessage('Thanks — your report has been submitted.');
    } else setMessage(res.error ?? 'Could not submit report');
  }

  if (loading) return <p className="text-gray-500">Loading…</p>;
  if (notFound || !listing) {
    return (
      <div className="py-20 text-center">
        <h1 className="text-2xl font-bold">Listing not available</h1>
        <p className="mt-2 text-gray-600">This listing may have been sold or removed.</p>
        <Link href="/" className="btn-primary mt-6 inline-block">Back to marketplace</Link>
      </div>
    );
  }

  const isOwner = user?.id === listing.seller.id;
  const unavailable = listing.status !== 'active';

  return (
    <div>
      {message && <p className="mb-4 rounded bg-amber-50 p-2 text-sm text-amber-800">{message}</p>}

      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <div className="card overflow-hidden">
            <div className="aspect-square bg-gray-100">
              {listing.images[activeImage] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={listing.images[activeImage].url} alt={listing.title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-gray-400">No image</div>
              )}
            </div>
          </div>
          {listing.images.length > 1 && (
            <div className="mt-2 flex gap-2">
              {listing.images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImage(i)}
                  className={`h-16 w-16 overflow-hidden rounded border-2 ${i === activeImage ? 'border-brand-500' : 'border-transparent'}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl font-bold">{listing.title}</h1>
            {unavailable && (
              <span className="badge bg-red-100 text-red-700">{STATUS_LABELS[listing.status]}</span>
            )}
          </div>

          <p className="text-3xl font-bold">{formatPrice(listing.price)}</p>

          <div className="flex flex-wrap gap-2">
            <span className="badge bg-brand-50 text-brand-700">{CONDITION_LABELS[listing.condition]}</span>
            <span className="badge bg-gray-100 text-gray-600">{listing.category.name}</span>
            <span className="badge bg-gray-100 text-gray-600">Qty: {listing.quantity}</span>
          </div>

          <div className="whitespace-pre-wrap rounded-md border border-gray-200 bg-white p-4 text-sm">
            {listing.description}
          </div>

          <div className="rounded-md border border-gray-200 bg-white p-4">
            <p className="text-sm text-gray-600">Sold by</p>
            <Link href={`/sellers/${listing.seller.id}`} className="font-medium text-brand-600 hover:underline">
              {listing.seller.display_name}
            </Link>
          </div>

          <div className="flex flex-wrap gap-2">
            {isOwner ? (
              <>
                {listing.status === 'draft' && (
                  <button className="btn-primary" disabled={busy} onClick={() => action(`/api/v1/listings/${id}/publish`)}>
                    Publish
                  </button>
                )}
                {listing.status === 'active' && (
                  <>
                    <button className="btn-primary" disabled={busy} onClick={() => action(`/api/v1/listings/${id}/mark-sold`)}>
                      Mark as sold
                    </button>
                    <button className="btn-secondary" disabled={busy} onClick={() => action(`/api/v1/listings/${id}/deactivate`)}>
                      Deactivate
                    </button>
                  </>
                )}
                {listing.status === 'inactive' && (
                  <button className="btn-primary" disabled={busy} onClick={() => action(`/api/v1/listings/${id}/reactivate`)}>
                    Reactivate
                  </button>
                )}
                {listing.status !== 'sold' && listing.status !== 'removed' && (
                  <Link href={`/listings/${id}/edit`} className="btn-secondary">
                    Edit
                  </Link>
                )}
                {listing.status !== 'sold' && listing.status !== 'removed' && (
                  <button className="btn-danger" disabled={busy} onClick={() => action(`/api/v1/listings/${id}`, 'DELETE')}>
                    Delete
                  </button>
                )}
              </>
            ) : (
              <>
                {!unavailable && (
                  <button className="btn-primary" disabled={busy} onClick={contactSeller}>
                    Contact seller
                  </button>
                )}
                {user ? (
                  saved ? (
                    <button className="btn-secondary" disabled={busy} onClick={removeFromWishlist}>
                      Saved ✓
                    </button>
                  ) : (
                    <button className="btn-secondary" disabled={busy} onClick={save}>
                      Save to wishlist
                    </button>
                  )
                ) : (
                  <Link href="/login" className="btn-secondary">
                    Log in to save
                  </Link>
                )}
              </>
            )}
          </div>

          {user && !isOwner && (
            <div>
              <button className="text-sm text-gray-500 underline" onClick={() => setShowReport((v) => !v)}>
                Report this listing
              </button>
              {showReport && (
                <div className="mt-2 space-y-2 rounded-md border border-gray-200 p-3">
                  <select className="input" value={reportReason} onChange={(e) => setReportReason(e.target.value)}>
                    {REPORT_REASONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  <textarea
                    className="input"
                    placeholder="Optional note"
                    rows={2}
                    value={reportNote}
                    onChange={(e) => setReportNote(e.target.value)}
                  />
                  <button className="btn-secondary" disabled={busy} onClick={submitReport}>
                    Submit report
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
