import type { Prisma } from '@prisma/client';
import {
  CURRENCY,
  minorToRupees,
  type Category,
  type Condition,
  type Conversation,
  type Listing,
  type ListingStatus,
  type ListingSummary,
  type Message,
  type Report,
  type ReportReason,
  type SellerPublic,
  type User,
  type WishlistItem,
} from '@/shared/types';

const lower = (s: string) => s.toLowerCase();

export const listingInclude = {
  seller: { include: { profile: true } },
  category: true,
  images: { orderBy: { position: 'asc' as const } },
} satisfies Prisma.ListingInclude;

export const conversationInclude = {
  listing: { select: { id: true, title: true, status: true } },
  buyer: { include: { profile: true } },
  seller: { include: { profile: true } },
  messages: { orderBy: { createdAt: 'desc' as const }, take: 1 },
} satisfies Prisma.ConversationInclude;

export function displayName(user: { profile?: { displayName: string } | null } | null | undefined): string {
  return user?.profile?.displayName ?? 'Unknown';
}

export function toCategory(c: { id: string; name: string; slug: string }): Category {
  return { id: c.id, name: c.name, slug: c.slug };
}

export function toListingSummary(l: any): ListingSummary {
  return {
    id: l.id,
    title: l.title,
    price: minorToRupees(l.priceMinor),
    currency: CURRENCY,
    condition: lower(l.condition) as Condition,
    quantity: l.quantity,
    status: lower(l.status) as ListingStatus,
    category: toCategory(l.category),
    seller: { id: l.sellerId, display_name: displayName(l.seller) },
    images: (l.images ?? []).map((img: any) => ({
      id: img.id,
      url: img.url,
      position: img.position,
    })),
    created_at: l.createdAt.toISOString(),
  };
}

export function toListing(l: any): Listing {
  return {
    ...toListingSummary(l),
    description: l.description,
    version: l.version,
    published_at: l.publishedAt ? l.publishedAt.toISOString() : null,
    sold_at: l.soldAt ? l.soldAt.toISOString() : null,
    updated_at: l.updatedAt.toISOString(),
  };
}

export function toUser(u: any): User {
  return {
    id: u.id,
    email: u.email,
    role: lower(u.role) as User['role'],
    status: lower(u.status) as User['status'],
    email_verified: u.emailVerifiedAt != null,
    profile: {
      display_name: u.profile?.displayName ?? '',
      university_id: u.profile?.universityId ?? null,
      profile_image_url: u.profile?.profileImageUrl ?? null,
      bio: u.profile?.bio ?? null,
    },
  };
}

export function toSellerPublic(u: any, activeCount: number): SellerPublic {
  return {
    id: u.id,
    display_name: displayName(u),
    university: u.profile?.university
      ? { id: u.profile.university.id, name: u.profile.university.name }
      : null,
    profile_image_url: u.profile?.profileImageUrl ?? null,
    bio: u.profile?.bio ?? null,
    active_listing_count: activeCount,
  };
}

export function toMessage(m: any): Message {
  return {
    id: m.id,
    sender_id: m.senderId,
    body: m.body,
    created_at: m.createdAt.toISOString(),
  };
}

export function toConversation(c: any, currentUserId: string): Conversation {
  const isBuyer = c.buyerId === currentUserId;
  const counterpart = isBuyer ? c.seller : c.buyer;
  const last = c.messages?.[0] ?? null;
  return {
    id: c.id,
    listing: {
      id: c.listing.id,
      title: c.listing.title,
      status: lower(c.listing.status) as ListingStatus,
    },
    counterpart: { id: counterpart.id, display_name: displayName(counterpart) },
    last_message: last ? { body: last.body, created_at: last.createdAt.toISOString() } : null,
    updated_at: c.updatedAt.toISOString(),
    created_at: c.createdAt.toISOString(),
  };
}

export function toWishlistItem(w: any): WishlistItem {
  const listing = w.listing;
  return {
    listing_id: listing.id,
    title: listing.title,
    price: minorToRupees(listing.priceMinor),
    currency: CURRENCY,
    condition: lower(listing.condition) as Condition,
    status: lower(listing.status) as ListingStatus,
    cover_image_url: listing.images?.[0]?.url ?? null,
    available: listing.status === 'ACTIVE',
    saved_at: w.createdAt.toISOString(),
  };
}

export function toReport(r: any): Report {
  return {
    id: r.id,
    reporter_id: r.reporterId,
    listing_id: r.listingId,
    reason: lower(r.reason) as ReportReason,
    note: r.note ?? null,
    status: lower(r.status) as Report['status'],
    created_at: r.createdAt.toISOString(),
  };
}
