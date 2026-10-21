'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api-client';
import { ListingForm } from '@/components/ListingForm';
import type { Listing } from '@/shared/types';

export default function EditListingPage() {
  const params = useParams<{ id: string }>();
  const [listing, setListing] = useState<Listing | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api<Listing>(`/api/v1/listings/${params.id}`).then((res) => {
      if (res.ok && res.data) setListing(res.data);
      else setError(res.error ?? 'Failed to load listing');
    });
  }, [params.id]);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!listing) return <p className="text-gray-500">Loading…</p>;
  return <ListingForm listing={listing} />;
}
