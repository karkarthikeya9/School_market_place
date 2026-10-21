'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { useAuth } from '@/components/Providers';

export default function LoginPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const res = await api('/api/v1/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    setBusy(false);
    if (res.ok) {
      await refresh();
      router.push('/');
    } else {
      setError(res.error ?? 'Login failed');
    }
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="text-2xl font-bold">Log in</h1>
      <form onSubmit={submit} className="card mt-4 space-y-4 p-6">
        {error && <p className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>}
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" className="input mt-1" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" type="password" className="input mt-1" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button className="btn-primary w-full" disabled={busy}>Log in</button>
        <p className="text-center text-sm text-gray-600">
          No account? <Link href="/register" className="text-brand-600 hover:underline">Register</Link>
        </p>
      </form>
    </div>
  );
}
