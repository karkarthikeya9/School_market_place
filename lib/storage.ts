import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { Errors } from './errors';

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

function storageConfigured(): boolean {
  return Boolean(
    process.env.STORAGE_BUCKET &&
      process.env.STORAGE_ACCESS_KEY_ID &&
      process.env.STORAGE_SECRET_ACCESS_KEY,
  );
}

function client(): S3Client {
  const endpoint = process.env.STORAGE_ENDPOINT || undefined;
  const region = process.env.STORAGE_REGION || 'auto';
  return new S3Client({
    region,
    endpoint,
    forcePathStyle: Boolean(endpoint),
    credentials: {
      accessKeyId: process.env.STORAGE_ACCESS_KEY_ID!,
      secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY!,
    },
  });
}

/** Validate content by magic bytes (never trust the client filename or MIME). */
export function detectImageType(buffer: Buffer): { ext: string; mime: string } | null {
  if (buffer.length < 12) return null;
  // JPEG
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { ext: 'jpg', mime: 'image/jpeg' };
  }
  // PNG
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return { ext: 'png', mime: 'image/png' };
  }
  // WebP (RIFF....WEBP)
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { ext: 'webp', mime: 'image/webp' };
  }
  return null;
}

export function validateImage(buffer: Buffer): { ext: string; mime: string } {
  if (buffer.length === 0) throw Errors.validation('Empty file');
  if (buffer.length > MAX_BYTES) throw Errors.validation('Image exceeds 5 MB limit');
  const detected = detectImageType(buffer);
  if (!detected) throw Errors.validation('Unsupported image type (use JPEG, PNG, or WebP)');
  return detected;
}

/** Upload a listing image to object storage and return its public URL. */
export async function uploadListingImage(
  listingId: string,
  buffer: Buffer,
  detected: { ext: string; mime: string },
): Promise<{ storageKey: string; url: string }> {
  if (!storageConfigured()) {
    throw Errors.internal('Image storage is not configured');
  }
  const key = `listings/${listingId}/${randomUUID()}.${detected.ext}`;
  const bucket = process.env.STORAGE_BUCKET!;
  await client().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: detected.mime,
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  );
  return { storageKey: key, url: publicUrl(key) };
}

export async function deleteImage(key: string): Promise<void> {
  if (!storageConfigured()) return;
  await client()
    .send(new DeleteObjectCommand({ Bucket: process.env.STORAGE_BUCKET!, Key: key }))
    .catch((err) => console.error('[storage-delete-error]', err));
}

function publicUrl(key: string): string {
  const base = process.env.STORAGE_PUBLIC_URL;
  if (base) return `${base.replace(/\/$/, '')}/${key}`;
  const bucket = process.env.STORAGE_BUCKET!;
  const endpoint = process.env.STORAGE_ENDPOINT;
  if (endpoint) return `${endpoint.replace(/\/$/, '')}/${bucket}/${key}`;
  const region = process.env.STORAGE_REGION || 'us-east-1';
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}
