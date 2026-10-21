import type { Condition } from '@prisma/client';
import { prisma } from '@/lib/db';
import { listingInclude, toListing } from '@/lib/dto';
import { Errors } from '@/lib/errors';
import { requireActiveUser, requireSession } from '@/lib/guards';
import { ok, parseBody, withError } from '@/lib/http';
import { updateListingSchema } from '@/shared/schemas';
import { rupeesToMinor } from '@/shared/types';

export const dynamic = 'force-dynamic';

async function loadOwnedOrThrow(id: string, actor: { id: string; role: 'STUDENT' | 'ADMIN' }) {
  const listing = await prisma.listing.findUnique({ where: { id }, include: listingInclude });
  if (!listing) throw Errors.notFound('Listing not found');
  const isOwner = listing.sellerId === actor.id;
  if (!isOwner && actor.role !== 'ADMIN') throw Errors.forbidden();
  return listing;
}

export function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  return withError(async () => {
    const { id } = await ctx.params;
    const listing = await prisma.listing.findUnique({ where: { id }, include: listingInclude });
    if (!listing) throw Errors.notFound('Listing not found');

    if (listing.status === 'ACTIVE') return ok(toListing(listing));

    // Non-active listings are only visible to the owner or an admin.
    const session = await requireSession();
    const isOwner = listing.sellerId === session.id;
    const isAdmin = session.role === 'ADMIN';
    if (!isOwner && !isAdmin) throw Errors.notFound('Listing not found');

    return ok(toListing(listing));
  });
}

export function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return withError(async () => {
    const { id } = await ctx.params;
    const { user } = await requireActiveUser();
    const body = await parseBody(req, updateListingSchema);

    const listing = await loadOwnedOrThrow(id, { id: user.id, role: user.role });
    if (listing.status === 'SOLD' || listing.status === 'REMOVED') {
      throw Errors.conflict('This listing can no longer be edited');
    }
    if (body.version !== undefined && body.version !== listing.version) {
      throw Errors.conflict('This listing was updated by someone else; refresh and try again');
    }

    const data: Record<string, unknown> = {};
    if (body.title !== undefined) data.title = body.title;
    if (body.description !== undefined) data.description = body.description;
    if (body.price !== undefined) data.priceMinor = rupeesToMinor(body.price);
    if (body.category_id !== undefined) {
      const category = await prisma.category.findUnique({ where: { id: body.category_id } });
      if (!category) throw Errors.validation('Invalid category');
      data.categoryId = body.category_id;
    }
    if (body.condition !== undefined) data.condition = body.condition.toUpperCase() as Condition;
    if (body.quantity !== undefined) data.quantity = body.quantity;

    const updated = await prisma.listing.update({
      where: { id },
      data: { ...data, version: { increment: 1 } },
      include: listingInclude,
    });
    return ok(toListing(updated));
  });
}

export function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  return withError(async () => {
    const { id } = await ctx.params;
    const { user } = await requireActiveUser();
    await loadOwnedOrThrow(id, { id: user.id, role: user.role });

    const updated = await prisma.listing.update({
      where: { id },
      data: { status: 'REMOVED', version: { increment: 1 } },
      include: listingInclude,
    });
    return ok(toListing(updated));
  });
}
