'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { useAuth } from '@/components/Providers';

export default function AccountPage() {
  const { user, loading, refresh } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.profile.display_name ?? '');
      setBio(user.profile.bio ?? '');
    }
  }, [user]);

  if (loading) return <p className="text-gray-500">Loading…</p>;
  if (!user) {
    return (
      <div className="py-20 text-center">
        <Link href="/login" className="btn-primary inline-block">Log in</Link>
      </div>
    );
  }

  async function save() {
    setBusy(true);
    setMessage('');
    const res = await api('/api/v1/me', {
      method: 'PATCH',
      body: JSON.stringify({ display_name: displayName, bio }),
    });
    setBusy(false);
    if (res.ok) {
      setMessage('Profile saved.');
      await refresh();
    } else {
      setMessage(res.error ?? 'Failed to save');
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">Account</h1>

      <div className="card space-y-4 p-6">
        <div>
          <span className="label">Email</span>
          <p className="text-sm text-gray-600">{user.email}</p>
        </div>
        <div>
          <span className="label">Role</span>
          <p className="text-sm text-gray-600">{user.role}</p>
        </div>
        <div>
          <label className="label" htmlFor="displayName">Display name</label>
          <input id="displayName" className="input mt-1" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={80} />
        </div>
        <div>
          <label className="label" htmlFor="bio">Bio</label>
          <textarea id="bio" className="input mt-1" rows={3} value={bio} onChange={(e) => setBio(e.target.value)} maxLength={500} />
        </div>
        {message && <p className="text-sm text-green-700">{message}</p>}
        <button className="btn-primary" disabled={busy} onClick={save}>Save</button>
      </div>

      <div className="flex gap-3">
        <Link href="/my-listings" className="btn-secondary">My listings</Link>
        <Link href="/wishlist" className="btn-secondary">Wishlist</Link>
        <Link href="/messages" className="btn-secondary">Messages</Link>
      </div>
    </div>
  );
}
