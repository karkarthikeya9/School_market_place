'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { ListingCard } from '@/components/ListingCard';
import type { Category, ListingSummary, Paginated } from '@/shared/types';

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [listings, setListings] = useState<ListingSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api<{ items: Category[] }>('/api/v1/categories'),
      api<Paginated<ListingSummary>>('/api/v1/listings?page_size=8&sort=newest'),
    ]).then(([catRes, listRes]) => {
      if (catRes.ok && catRes.data) setCategories(catRes.data.items);
      if (listRes.ok && listRes.data) setListings(listRes.data.items);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-8">
      <section className="rounded-xl bg-brand-700 px-6 py-10 text-white">
        <h1 className="text-3xl font-bold">Buy and sell second-hand on campus</h1>
        <p className="mt-2 text-brand-100">
          Textbooks, electronics, furniture, and more — directly between students.
        </p>
        <div className="mt-4 flex gap-3">
          <Link href="/listings" className="rounded-md bg-white px-4 py-2 text-sm font-medium text-brand-700 hover:bg-gray-100">
            Browse listings
          </Link>
          <Link href="/sell" className="rounded-md border border-white/40 px-4 py-2 text-sm font-medium hover:bg-white/10">
            Sell an item
          </Link>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Browse categories</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/listings?category=${encodeURIComponent(c.slug)}`}
              className="rounded-full border border-gray-200 bg-white px-4 py-1.5 text-sm hover:border-brand-500 hover:text-brand-600"
            >
              {c.name}
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Recently listed</h2>
        {loading ? (
          <p className="mt-3 text-gray-500">Loading…</p>
        ) : listings.length === 0 ? (
          <p className="mt-3 text-gray-500">No listings yet. Be the first to sell something!</p>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {listings.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
