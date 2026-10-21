export type ApiResult<T = unknown> = {
  ok: boolean;
  status: number;
  data: T | null;
  error?: string;
};

/** Client-side fetch against the same-origin API. */
export async function api<T = unknown>(
  path: string,
  init?: RequestInit,
): Promise<ApiResult<T>> {
  const res = await fetch(path, {
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init?.headers ?? {}),
    },
    credentials: 'same-origin',
  });

  let data: unknown = null;
  const contentType = res.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    data = await res.json().catch(() => null);
  }

  const error =
    data && typeof data === 'object' && 'error' in data
      ? ((data as { error: { message?: string } }).error.message ?? 'Request failed')
      : undefined;

  return { ok: res.ok, status: res.status, data: data as T, error };
}

export async function uploadImage(listingId: string, file: File): Promise<ApiResult<{ id: string; url: string; position: number }>> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`/api/v1/listings/${listingId}/images`, {
    method: 'POST',
    body: form,
    credentials: 'same-origin',
  });
  let data: unknown = null;
  const ct = res.headers.get('content-type') ?? '';
  if (ct.includes('application/json')) data = await res.json().catch(() => null);
  const error =
    data && typeof data === 'object' && 'error' in data
      ? ((data as { error: { message?: string } }).error.message)
      : undefined;
  return { ok: res.ok, status: res.status, data: data as { id: string; url: string; position: number }, error };
}
