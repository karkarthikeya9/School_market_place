'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import type { Conversation, Paginated } from '@/shared/types';

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Paginated<Conversation>>('/api/v1/conversations').then((res) => {
      if (res.ok && res.data) setConversations(res.data.items);
      setLoading(false);
    });
  }, []);

  if (loading) return <p className="text-gray-500">Loading…</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Messages</h1>
      {conversations.length === 0 ? (
        <p className="text-gray-500">No conversations yet. Find a listing and contact its seller.</p>
      ) : (
        <div className="space-y-2">
          {conversations.map((c) => (
            <Link key={c.id} href={`/messages/${c.id}`} className="card block p-4 hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="font-medium">{c.counterpart.display_name}</span>
                {c.last_message && (
                  <span className="text-xs text-gray-500">
                    {new Date(c.last_message.created_at).toLocaleString()}
                  </span>
                )}
              </div>
              <p className="mt-1 truncate text-sm text-gray-600">
                {c.last_message ? c.last_message.body : 'No messages yet'}
              </p>
              <p className="mt-1 text-xs text-gray-400">About: {c.listing.title}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
