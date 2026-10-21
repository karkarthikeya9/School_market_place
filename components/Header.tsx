'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from './Providers';

export function Header() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [q, setQ] = useState('');

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const query = q.trim();
    router.push(query ? `/listings?q=${encodeURIComponent(query)}` : '/listings');
  }

  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white">
      <div className="container flex h-16 items-center gap-4">
        <Link href="/" className="text-lg font-bold text-brand-700 whitespace-nowrap">
          Student Marketplace
        </Link>

        <form onSubmit={submitSearch} className="flex flex-1 gap-2">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search textbooks, electronics, furniture…"
            className="input"
            aria-label="Search listings"
          />
          <button type="submit" className="btn-secondary shrink-0">
            Search
          </button>
        </form>

        <nav className="flex items-center gap-3 text-sm whitespace-nowrap">
          <Link href="/listings" className="hover:underline">
            Browse
          </Link>
          <Link href="/sell" className="hover:underline">
            Sell
          </Link>
          {!loading && user ? (
            <>
              <Link href="/wishlist" className="hover:underline">
                Wishlist
              </Link>
              <Link href="/messages" className="hover:underline">
                Messages
              </Link>
              <Link href="/account" className="hover:underline">
                Account
              </Link>
              {user.role === 'admin' && (
                <Link href="/admin" className="font-semibold text-red-600 hover:underline">
                  Admin
                </Link>
              )}
              <button
                onClick={async () => {
                  await logout();
                  router.push('/');
                }}
                className="hover:underline"
              >
                Log out
              </button>
            </>
          ) : !loading ? (
            <>
              <Link href="/login" className="hover:underline">
                Log in
              </Link>
              <Link href="/register" className="btn-primary">
                Register
              </Link>
            </>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
