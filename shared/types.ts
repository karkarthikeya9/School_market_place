// Shared constants and response DTO types (mirror docs/openapi.yaml).

export const CONDITIONS = ['new', 'like_new', 'very_good', 'good', 'acceptable'] as const;
export type Condition = (typeof CONDITIONS)[number];

export const LISTING_STATUSES = ['draft', 'active', 'sold', 'inactive', 'removed'] as const;
export type ListingStatus = (typeof LISTING_STATUSES)[number];

export const REPORT_REASONS = ['prohibited', 'misleading', 'spam', 'other'] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export const CONDITION_LABELS: Record<Condition, string> = {
  new: 'New',
  like_new: 'Like New',
  very_good: 'Very Good',
  good: 'Good',
  acceptable: 'Acceptable',
};

export const STATUS_LABELS: Record<ListingStatus, string> = {
  draft: 'Draft',
  active: 'Active',
  sold: 'Sold',
  inactive: 'Inactive',
  removed: 'Removed',
};

export const CURRENCY = 'INR';

// Prices are stored as integer paise; the API exposes rupees.
export function rupeesToMinor(rupees: number): number {
  return Math.round(rupees * 100);
}
export function minorToRupees(minor: number): number {
  return minor / 100;
}
export function formatPrice(rupees: number): string {
  return `₹${rupees.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export type Category = { id: string; name: string; slug: string };

export type University = { id: string; name: string };

export type PublicProfile = {
  display_name: string;
  university_id?: string | null;
  profile_image_url?: string | null;
  bio?: string | null;
};

export type User = {
  id: string;
  email: string;
  role: 'student' | 'admin';
  status: 'active' | 'suspended';
  email_verified: boolean;
  profile: PublicProfile;
};

export type ListingImage = { id: string; url: string; position: number };

export type ListingSummary = {
  id: string;
  title: string;
  price: number;
  currency: string;
  condition: Condition;
  quantity: number;
  status: ListingStatus;
  category: Category;
  seller: { id: string; display_name: string };
  images: ListingImage[];
  created_at: string;
};

export type Listing = ListingSummary & {
  description: string;
  version: number;
  published_at?: string | null;
  sold_at?: string | null;
  updated_at: string;
};

export type SellerPublic = {
  id: string;
  display_name: string;
  university?: University | null;
  profile_image_url?: string | null;
  bio?: string | null;
  active_listing_count: number;
};

export type Message = {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export type Conversation = {
  id: string;
  listing: { id: string; title: string; status: ListingStatus };
  counterpart: { id: string; display_name: string };
  last_message: { body: string; created_at: string } | null;
  updated_at: string;
  created_at: string;
};

export type WishlistItem = {
  listing_id: string;
  title: string;
  price: number;
  currency: string;
  condition: Condition;
  status: ListingStatus;
  cover_image_url?: string | null;
  available: boolean;
  saved_at: string;
};

export type Report = {
  id: string;
  reporter_id: string;
  listing_id: string;
  reason: ReportReason;
  note?: string | null;
  status: 'open' | 'resolved' | 'dismissed';
  created_at: string;
};

export type Paginated<T> = {
  items: T[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
};
