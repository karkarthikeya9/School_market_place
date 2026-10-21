'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, uploadImage } from '@/lib/api-client';
import { CONDITIONS, CONDITION_LABELS, type Category, type Condition, type Listing } from '@/shared/types';

type ImageState = { id?: string; url: string; file?: File };

export function ListingForm({ listing }: { listing?: Listing }) {
  const isEdit = Boolean(listing);
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState(listing?.title ?? '');
  const [description, setDescription] = useState(listing?.description ?? '');
  const [price, setPrice] = useState(listing ? String(listing.price) : '');
  const [categoryId, setCategoryId] = useState(listing?.category.id ?? '');
  const [condition, setCondition] = useState<Condition>(listing?.condition ?? 'good');
  const [quantity, setQuantity] = useState(String(listing?.quantity ?? 1));
  const [images, setImages] = useState<ImageState[]>(
    listing?.images.map((i) => ({ id: i.id, url: i.url })) ?? [],
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api<{ items: Category[] }>('/api/v1/categories').then((res) => {
      if (res.ok && res.data) {
        setCategories(res.data.items);
        if (!categoryId && res.data.items.length) setCategoryId(res.data.items[0].id);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onFiles(files: FileList | null) {
    if (!files) return;
    const incoming = Array.from(files).slice(0, 5 - images.length);
    if (isEdit && listing) {
      // Upload immediately for an existing listing.
      incoming.forEach(async (file) => {
        const res = await uploadImage(listing.id, file);
        if (res.ok && res.data) {
          setImages((prev) => [...prev, { id: res.data!.id, url: res.data!.url }]);
        } else {
          setError(res.error ?? 'Image upload failed');
        }
      });
    } else {
      incoming.forEach((file) => {
        const url = URL.createObjectURL(file);
        setImages((prev) => [...prev, { url, file }]);
      });
    }
  }

  async function removeImage(img: ImageState) {
    if (img.id && listing) {
      const res = await api(`/api/v1/listings/${listing.id}/images/${img.id}`, { method: 'DELETE' });
      if (!res.ok) return setError(res.error ?? 'Could not remove image');
    }
    setImages((prev) => prev.filter((x) => x !== img));
  }

  function validate(): string | null {
    if (title.trim().length < 3) return 'Title must be at least 3 characters';
    if (description.trim().length < 1) return 'Description is required';
    if (!price || Number(price) <= 0) return 'Price must be greater than 0';
    if (!categoryId) return 'Choose a category';
    return null;
  }

  async function submit(publish: boolean) {
    const problem = validate();
    if (problem) return setError(problem);
    setBusy(true);
    setError('');

    if (isEdit && listing) {
      const res = await api<Listing>(`/api/v1/listings/${listing.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title,
          description,
          price: Number(price),
          category_id: categoryId,
          condition,
          quantity: Number(quantity),
          version: listing.version,
        }),
      });
      setBusy(false);
      if (res.ok && res.data) router.push(`/listings/${res.data.id}`);
      else setError(res.error ?? 'Failed to save');
      return;
    }

    // Create mode.
    const create = await api<Listing>('/api/v1/listings', {
      method: 'POST',
      body: JSON.stringify({
        title,
        description,
        price: Number(price),
        category_id: categoryId,
        condition,
        quantity: Number(quantity),
      }),
    });
    if (!create.ok || !create.data) {
      setBusy(false);
      setError(create.error ?? 'Failed to create listing');
      return;
    }
    const newListing = create.data;

    // Upload images (optional — failures are non-fatal so a listing can be
    // created and published even without image storage configured).
    let uploadError = '';
    for (const img of images) {
      if (img.file) {
        const up = await uploadImage(newListing.id, img.file);
        if (!up.ok) uploadError = up.error ?? 'Some images failed to upload';
      }
    }

    if (publish) {
      const pub = await api<Listing>(`/api/v1/listings/${newListing.id}/publish`, { method: 'POST' });
      setBusy(false);
      if (!pub.ok) setError(pub.error ?? 'Listing created as draft (publish failed)');
      else if (uploadError) setError(`Listing published, but: ${uploadError}`);
    } else {
      setBusy(false);
      if (uploadError) setError(`Listing saved as draft, but: ${uploadError}`);
    }
    router.push(`/listings/${newListing.id}`);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">{isEdit ? 'Edit listing' : 'Sell an item'}</h1>
      {error && <p className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>}

      <div>
        <label className="label">Title</label>
        <input className="input mt-1" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
      </div>

      <div>
        <label className="label">Description</label>
        <textarea className="input mt-1" rows={5} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={4000} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Price (₹)</label>
          <input className="input mt-1" type="number" min={0} step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
        <div>
          <label className="label">Quantity</label>
          <input className="input mt-1" type="number" min={1} max={100} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Category</label>
          <select className="input mt-1" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Condition</label>
          <select className="input mt-1" value={condition} onChange={(e) => setCondition(e.target.value as Condition)}>
            {CONDITIONS.map((c) => (
              <option key={c} value={c}>{CONDITION_LABELS[c]}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <span className="label">Images ({images.length}/5) — optional</span>
        <div className="mt-2 flex flex-wrap gap-3">
          {images.map((img, i) => (
            <div key={img.id ?? img.url} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt={`Image ${i + 1}`} className="h-24 w-24 rounded border object-cover" />
              <button
                type="button"
                onClick={() => removeImage(img)}
                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs text-white"
                aria-label="Remove image"
              >
                ×
              </button>
            </div>
          ))}
          {images.length < 5 && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex h-24 w-24 items-center justify-center rounded border border-dashed border-gray-300 text-2xl text-gray-400 hover:border-brand-500"
            >
              +
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
      </div>

      <div className="flex gap-3">
        {isEdit ? (
          <button className="btn-primary" disabled={busy} onClick={() => submit(false)}>
            Save changes
          </button>
        ) : (
          <>
            <button className="btn-secondary" disabled={busy} onClick={() => submit(false)}>
              Save as draft
            </button>
            <button className="btn-primary" disabled={busy} onClick={() => submit(true)}>
              Publish listing
            </button>
          </>
        )}
      </div>
    </div>
  );
}
