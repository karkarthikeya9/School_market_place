'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { useAuth } from '@/components/Providers';

export default function RegisterPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const res = await api('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, display_name: displayName }),
    });
    setBusy(false);
    if (res.ok) {
      await refresh();
      router.push('/');
    } else {
      setError(res.error ?? 'Registration failed');
    }
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="text-2xl font-bold">Create an account</h1>
      <form onSubmit={submit} className="card mt-4 space-y-4 p-6">
        {error && <p className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>}
        <div>
          <label className="label" htmlFor="displayName">Display name</label>
          <input id="displayName" className="input mt-1" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={80} required />
        </div>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" className="input mt-1" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" type="password" className="input mt-1" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
          <p className="mt-1 text-xs text-gray-500">At least 8 characters.</p>
        </div>
        <button className="btn-primary w-full" disabled={busy}>Register</button>
        <p className="text-center text-sm text-gray-600">
          Already have an account? <Link href="/login" className="text-brand-600 hover:underline">Log in</Link>
        </p>
      </form>
    </div>
  );
}
