'use client';

import Link from 'next/link';
import { ListingForm } from '@/components/ListingForm';
import { useAuth } from '@/components/Providers';

export default function SellPage() {
  const { user, loading } = useAuth();
  if (loading) return <p className="text-gray-500">Loading…</p>;
  if (!user) {
    return (
      <div className="py-20 text-center">
        <h1 className="text-2xl font-bold">Log in to sell</h1>
        <p className="mt-2 text-gray-600">You need an account to list an item.</p>
        <Link href="/login" className="btn-primary mt-6 inline-block">Log in</Link>
      </div>
    );
  }
  return <ListingForm />;
}
