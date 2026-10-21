'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/components/Providers';
import { api } from '@/lib/api-client';
import type { Report } from '@/shared/types';

export default function AdminPage() {
  const { user, loading } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [listingId, setListingId] = useState('');
  const [modAction, setModAction] = useState('deactivate');
  const [modReason, setModReason] = useState('');
  const [userId, setUserId] = useState('');
  const [message, setMessage] = useState('');

  const loadReports = useCallback(async () => {
    const res = await api<{ items: Report[] }>('/api/v1/admin/reports?status=open');
    if (res.ok && res.data) setReports(res.data.items);
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') loadReports();
  }, [user, loadReports]);

  if (loading) return <p className="text-gray-500">Loading…</p>;
  if (!user || user.role !== 'admin') {
    return <p className="text-red-600">Administrator access required.</p>;
  }

  async function resolve(reportId: string, decision: 'resolved' | 'dismissed') {
    const res = await api(`/api/v1/admin/reports/${reportId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ decision }),
    });
    setMessage(res.ok ? 'Report updated.' : res.error ?? 'Failed');
    await loadReports();
  }

  async function moderate() {
    if (!listingId) return setMessage('Enter a listing id');
    const res = await api(`/api/v1/admin/listings/${listingId}/moderate`, {
      method: 'POST',
      body: JSON.stringify({ action: modAction, reason: modReason || 'Moderation' }),
    });
    setMessage(res.ok ? 'Listing moderated.' : res.error ?? 'Failed');
  }

  async function userAction(action: 'suspend' | 'reactivate') {
    if (!userId) return setMessage('Enter a user id');
    const res = await api(`/api/v1/admin/users/${userId}/${action}`, { method: 'POST' });
    setMessage(res.ok ? `User ${action}ed.` : res.error ?? 'Failed');
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <h1 className="text-2xl font-bold">Admin</h1>
      {message && <p className="rounded bg-amber-50 p-2 text-sm text-amber-800">{message}</p>}

      <section className="card p-5">
        <h2 className="font-semibold">Open reports ({reports.length})</h2>
        {reports.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">No open reports.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {reports.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center gap-3 rounded border border-gray-200 p-3">
                <div className="min-w-0 flex-1 text-sm">
                  <p className="font-mono text-xs">listing: {r.listing_id}</p>
                  <p className="mt-1">Reason: <span className="font-medium">{r.reason}</span>{r.note ? ` — ${r.note}` : ''}</p>
                </div>
                <button className="btn-secondary" onClick={() => resolve(r.id, 'resolved')}>Resolve</button>
                <button className="btn-danger" onClick={() => resolve(r.id, 'dismissed')}>Dismiss</button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card space-y-3 p-5">
        <h2 className="font-semibold">Moderate a listing</h2>
        <input className="input" placeholder="Listing id" value={listingId} onChange={(e) => setListingId(e.target.value)} />
        <div className="flex gap-3">
          <select className="input" value={modAction} onChange={(e) => setModAction(e.target.value)}>
            <option value="deactivate">Deactivate</option>
            <option value="reactivate">Reactivate</option>
            <option value="remove">Remove</option>
          </select>
          <input className="input" placeholder="Reason" value={modReason} onChange={(e) => setModReason(e.target.value)} />
        </div>
        <button className="btn-primary" onClick={moderate}>Apply</button>
      </section>

      <section className="card space-y-3 p-5">
        <h2 className="font-semibold">Manage users</h2>
        <input className="input" placeholder="User id" value={userId} onChange={(e) => setUserId(e.target.value)} />
        <div className="flex gap-3">
          <button className="btn-danger" onClick={() => userAction('suspend')}>Suspend</button>
          <button className="btn-secondary" onClick={() => userAction('reactivate')}>Reactivate</button>
        </div>
      </section>
    </div>
  );
}
