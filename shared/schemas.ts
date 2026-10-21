import { z } from 'zod';
import { CONDITIONS, REPORT_REASONS } from './types';

// ---- auth / profile ----
export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email('A valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  display_name: z.string().trim().min(1).max(80),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export const updateProfileSchema = z
  .object({
    display_name: z.string().trim().min(1).max(80).optional(),
    bio: z.string().trim().max(500).nullable().optional(),
    profile_image_url: z.string().trim().url().nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'No fields to update' });

// ---- listings ----
const priceSchema = z.number().positive('Price must be greater than 0').max(10_000_000);

export const createListingSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(1).max(4000),
  price: priceSchema,
  category_id: z.string().uuid(),
  condition: z.enum(CONDITIONS),
  quantity: z.number().int().min(1).max(100).default(1),
});

export const updateListingSchema = z.object({
  title: z.string().trim().min(3).max(120).optional(),
  description: z.string().trim().min(1).max(4000).optional(),
  price: priceSchema.optional(),
  category_id: z.string().uuid().optional(),
  condition: z.enum(CONDITIONS).optional(),
  quantity: z.number().int().min(1).max(100).optional(),
  version: z.number().int().min(1).optional(),
});

export const listingsQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  category_id: z.string().uuid().optional(),
  category: z.string().trim().max(120).optional(),
  min_price: z.coerce.number().min(0).optional(),
  max_price: z.coerce.number().min(0).optional(),
  condition: z.string().trim().optional(),
  sort: z.enum(['newest', 'relevance', 'price_asc', 'price_desc']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(20),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(20),
});

// ---- conversations / messages ----
export const conversationCreateSchema = z.object({
  listing_id: z.string().uuid(),
});

export const messageCreateSchema = z.object({
  body: z.string().trim().min(1).max(2000),
});

export const messagesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  before: z.string().uuid().optional(),
});

// ---- wishlist ----
export const wishlistAddSchema = z.object({
  listing_id: z.string().uuid(),
});

// ---- reports / moderation ----
export const reportCreateSchema = z.object({
  listing_id: z.string().uuid(),
  reason: z.enum(REPORT_REASONS),
  note: z.string().trim().max(500).optional(),
});

export const resolveReportSchema = z.object({
  decision: z.enum(['resolved', 'dismissed']),
  note: z.string().trim().max(500).optional(),
});

export const moderateSchema = z.object({
  action: z.enum(['deactivate', 'reactivate', 'remove']),
  reason: z.string().trim().min(1).max(1000),
});

export const reportsQuerySchema = z.object({
  status: z.enum(['open', 'resolved', 'dismissed']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(20),
});

export const reorderImagesSchema = z.object({
  image_ids: z.array(z.string().uuid()).min(1).max(5),
});
