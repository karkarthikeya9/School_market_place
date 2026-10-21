'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import { ListingCard } from '@/components/ListingCard';
import { CONDITIONS, CONDITION_LABELS, type Category, type Condition, type ListingSummary, type Paginated } from '@/shared/types';

type Filters = {
  q: string;
  category: string;
  min_price: string;
  max_price: string;
  conditions: Condition[];
  sort: string;
  page: number;
};

function readInitialFilters(): Filters {
  const sp = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  return {
    q: sp.get('q') ?? '',
    category: sp.get('category') ?? '',
    min_price: sp.get('min_price') ?? '',
    max_price: sp.get('max_price') ?? '',
    conditions: (sp.get('condition') ?? '')
      .split(',')
      .filter((c): c is Condition => (CONDITIONS as readonly string[]).includes(c)),
    sort: sp.get('sort') ?? 'newest',
    page: Number(sp.get('page') ?? '1') || 1,
  };
}

function buildQuery(f: Filters): string {
  const sp = new URLSearchParams();
  if (f.q) sp.set('q', f.q);
  if (f.category) sp.set('category', f.category);
  if (f.min_price) sp.set('min_price', f.min_price);
  if (f.max_price) sp.set('max_price', f.max_price);
  if (f.conditions.length) sp.set('condition', f.conditions.join(','));
  if (f.sort) sp.set('sort', f.sort);
  sp.set('page', String(f.page));
  return sp.toString();
}

export default function ListingsPage() {
  const [filters, setFilters] = useState<Filters>(readInitialFilters);
  const [categories, setCategories] = useState<Category[]>([]);
  const [result, setResult] = useState<Paginated<ListingSummary> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api<{ items: Category[] }>('/api/v1/categories').then((res) => {
      if (res.ok && res.data) setCategories(res.data.items);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    setError('');
    api<Paginated<ListingSummary>>(`/api/v1/listings?${buildQuery(filters)}`)
      .then((res) => {
        if (res.ok && res.data) setResult(res.data);
        else setError(res.error ?? 'Failed to load listings');
      })
      .catch(() => setError('Failed to load listings'))
      .finally(() => setLoading(false));
  }, [filters]);

  function patch(p: Partial<Filters>) {
    setFilters((f) => ({ ...f, ...p, page: p.page ?? 1 }));
  }

  function toggleCondition(c: Condition) {
    setFilters((f) => ({
      ...f,
      page: 1,
      conditions: f.conditions.includes(c) ? f.conditions.filter((x) => x !== c) : [...f.conditions, c],
    }));
  }

  const totalPages = result?.total_pages ?? 1;

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
      <aside className="space-y-4">
        <div>
          <label className="label">Category</label>
          <select
            className="input mt-1"
            value={filters.category}
            onChange={(e) => patch({ category: e.target.value })}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="label">Min ₹</label>
            <input
              type="number"
              className="input mt-1"
              min={0}
              placeholder="0"
              value={filters.min_price}
              onChange={(e) => patch({ min_price: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Max ₹</label>
            <input
              type="number"
              className="input mt-1"
              min={0}
              placeholder="Any"
              value={filters.max_price}
              onChange={(e) => patch({ max_price: e.target.value })}
            />
          </div>
        </div>

        <div>
          <span className="label">Condition</span>
          <div className="mt-1 space-y-1">
            {CONDITIONS.map((c) => (
              <label key={c} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={filters.conditions.includes(c)}
                  onChange={() => toggleCondition(c)}
                />
                {CONDITION_LABELS[c]}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Sort</label>
          <select className="input mt-1" value={filters.sort} onChange={(e) => patch({ sort: e.target.value })}>
            <option value="newest">Newest</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
          </select>
        </div>
      </aside>

      <div>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">
            {filters.q ? `Results for “${filters.q}”` : 'Browse listings'}
          </h1>
          {result && <span className="text-sm text-gray-500">{result.total} item{result.total === 1 ? '' : 's'}</span>}
        </div>

        {loading ? (
          <p className="mt-4 text-gray-500">Loading…</p>
        ) : error ? (
          <p className="mt-4 text-red-600">{error}</p>
        ) : !result || result.items.length === 0 ? (
          <p className="mt-4 text-gray-500">No listings match your filters.</p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {result.items.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        )}

        {result && totalPages > 1 && (
          <div className="mt-6 flex items-center gap-2">
            <button
              className="btn-secondary"
              disabled={filters.page <= 1}
              onClick={() => patch({ page: filters.page - 1 })}
            >
              Previous
            </button>
            <span className="text-sm">
              Page {filters.page} of {totalPages}
            </span>
            <button
              className="btn-secondary"
              disabled={filters.page >= totalPages}
              onClick={() => patch({ page: filters.page + 1 })}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
