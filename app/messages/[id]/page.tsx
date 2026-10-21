'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api-client';
import { useAuth } from '@/components/Providers';
import type { Conversation, Message } from '@/shared/types';

export default function ConversationPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(async () => {
    const res = await api<{ items: Message[] }>(`/api/v1/conversations/${params.id}/messages?limit=100`);
    if (res.ok && res.data) setMessages([...res.data.items].reverse());
  }, [params.id]);

  useEffect(() => {
    api<Conversation>(`/api/v1/conversations/${params.id}`).then((res) => {
      if (res.ok && res.data) setConversation(res.data);
      else setError(res.error ?? 'Conversation not found');
    });
    loadMessages();
    const t = setInterval(loadMessages, 3000);
    return () => clearInterval(t);
  }, [params.id, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    const res = await api(`/api/v1/conversations/${params.id}/messages`, {
      method: 'POST',
      body: JSON.stringify({ body: body.trim() }),
    });
    if (res.ok) {
      setBody('');
      await loadMessages();
    } else {
      setError(res.error ?? 'Failed to send message');
    }
  }

  if (error && !conversation) return <p className="text-red-600">{error}</p>;
  if (!conversation) return <p className="text-gray-500">Loading…</p>;

  return (
    <div className="mx-auto flex max-w-2xl flex-col" style={{ height: 'calc(100vh - 8rem)' }}>
      <div className="border-b border-gray-200 pb-2">
        <p className="text-sm text-gray-500">
          Chat with <span className="font-medium text-gray-900">{conversation.counterpart.display_name}</span>
        </p>
        <p className="truncate text-sm text-gray-500">About: {conversation.listing.title}</p>
      </div>

      {error && <p className="mt-2 rounded bg-amber-50 p-2 text-sm text-amber-800">{error}</p>}

      <div className="flex-1 space-y-3 overflow-y-auto py-4">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-gray-500">Start the conversation by sending a message.</p>
        ) : (
          messages.map((m) => {
            const own = m.sender_id === user?.id;
            return (
              <div key={m.id} className={`flex ${own ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${own ? 'bg-brand-600 text-white' : 'bg-gray-200 text-gray-900'}`}>
                  {m.body}
                  <div className={`mt-1 text-right text-xs ${own ? 'text-brand-100' : 'text-gray-500'}`}>
                    {new Date(m.created_at).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="flex gap-2 border-t border-gray-200 pt-3">
        <input
          className="input"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Type a message…"
          maxLength={2000}
        />
        <button type="submit" className="btn-primary shrink-0">Send</button>
      </form>
    </div>
  );
}
