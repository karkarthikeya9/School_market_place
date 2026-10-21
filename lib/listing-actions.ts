import { prisma } from './db';
import { Errors } from './errors';

export type Actor = { id: string; role: 'STUDENT' | 'ADMIN' };

function isOwner(listing: { sellerId: string }, actor: Actor): boolean {
  return listing.sellerId === actor.id;
}
function canMutate(listing: { sellerId: string }, actor: Actor): boolean {
  return isOwner(listing, actor) || actor.role === 'ADMIN';
}

async function load(id: string) {
  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) throw Errors.notFound('Listing not found');
  return listing;
}

function forbiddenUnless(cond: boolean) {
  if (!cond) throw Errors.forbidden();
}

export async function publishListing(id: string, actor: Actor) {
  const listing = await load(id);
  forbiddenUnless(isOwner(listing, actor));
  if (listing.status !== 'DRAFT') throw Errors.conflict('Only draft listings can be published');
  const imageCount = await prisma.listingImage.count({ where: { listingId: id } });
  if (imageCount < 1) throw Errors.validation('Add at least one image before publishing');

  const updated = await prisma.listing.update({
    where: { id },
    data: { status: 'ACTIVE', publishedAt: new Date(), version: { increment: 1 } },
    include: { seller: { include: { profile: true } }, category: true, images: { orderBy: { position: 'asc' } } },
  });
  return updated;
}

export async function markSold(id: string, actor: Actor) {
  const listing = await load(id);
  forbiddenUnless(isOwner(listing, actor));
  if (listing.status !== 'ACTIVE') throw Errors.conflict('Only active listings can be marked sold');
  const updated = await prisma.listing.update({
    where: { id },
    data: { status: 'SOLD', soldAt: new Date(), version: { increment: 1 } },
    include: { seller: { include: { profile: true } }, category: true, images: { orderBy: { position: 'asc' } } },
  });
  return updated;
}

export async function deactivateListing(id: string, actor: Actor) {
  const listing = await load(id);
  forbiddenUnless(canMutate(listing, actor));
  if (listing.status !== 'ACTIVE') throw Errors.conflict('Only active listings can be deactivated');
  return prisma.listing.update({
    where: { id },
    data: { status: 'INACTIVE', version: { increment: 1 } },
    include: { seller: { include: { profile: true } }, category: true, images: { orderBy: { position: 'asc' } } },
  });
}

export async function reactivateListing(id: string, actor: Actor) {
  const listing = await load(id);
  forbiddenUnless(canMutate(listing, actor));
  if (listing.status !== 'INACTIVE') throw Errors.conflict('Only inactive listings can be reactivated');
  return prisma.listing.update({
    where: { id },
    data: { status: 'ACTIVE', publishedAt: listing.publishedAt ?? new Date(), version: { increment: 1 } },
    include: { seller: { include: { profile: true } }, category: true, images: { orderBy: { position: 'asc' } } },
  });
}

export async function softDeleteListing(id: string, actor: Actor) {
  const listing = await load(id);
  forbiddenUnless(canMutate(listing, actor));
  if (listing.status === 'REMOVED' || listing.status === 'SOLD') {
    throw Errors.conflict('This listing cannot be deleted');
  }
  return prisma.listing.update({
    where: { id },
    data: { status: 'REMOVED', version: { increment: 1 } },
    include: { seller: { include: { profile: true } }, category: true, images: { orderBy: { position: 'asc' } } },
  });
}

export async function moderateListing(
  id: string,
  moderator: Actor & { email: string },
  action: 'DEACTIVATE' | 'REACTIVATE' | 'REMOVE',
  reason: string,
) {
  const listing = await load(id);
  forbiddenUnless(moderator.role === 'ADMIN');

  let status: 'ACTIVE' | 'INACTIVE' | 'REMOVED';
  if (action === 'DEACTIVATE') {
    if (listing.status !== 'ACTIVE') throw Errors.conflict('Only active listings can be deactivated');
    status = 'INACTIVE';
  } else if (action === 'REACTIVATE') {
    if (listing.status !== 'INACTIVE') throw Errors.conflict('Only inactive listings can be reactivated');
    status = 'ACTIVE';
  } else {
    status = 'REMOVED';
  }

  const updated = await prisma.$transaction(async (tx) => {
    const l = await tx.listing.update({
      where: { id },
      data: { status, version: { increment: 1 } },
      include: { seller: { include: { profile: true } }, category: true, images: { orderBy: { position: 'asc' } } },
    });
    await tx.moderationAction.create({
      data: { listingId: id, moderatorId: moderator.id, action, reason },
    });
    await tx.auditLog.create({
      data: {
        actorId: moderator.id,
        action: `moderate:${action.toLowerCase()}`,
        entityType: 'listing',
        entityId: id,
        metadata: { reason, moderator_email: moderator.email },
      },
    });
    return l;
  });
  return updated;
}

export async function suspendUser(id: string, moderator: Actor & { email: string }) {
  forbiddenUnless(moderator.role === 'ADMIN');
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw Errors.notFound('User not found');
  const updated = await prisma.user.update({ where: { id }, data: { status: 'SUSPENDED' } });
  await prisma.auditLog.create({
    data: {
      actorId: moderator.id,
      action: 'user:suspend',
      entityType: 'user',
      entityId: id,
      metadata: { moderator_email: moderator.email },
    },
  });
  return updated;
}

export async function reactivateUser(id: string, moderator: Actor & { email: string }) {
  forbiddenUnless(moderator.role === 'ADMIN');
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw Errors.notFound('User not found');
  const updated = await prisma.user.update({ where: { id }, data: { status: 'ACTIVE' } });
  await prisma.auditLog.create({
    data: {
      actorId: moderator.id,
      action: 'user:reactivate',
      entityType: 'user',
      entityId: id,
      metadata: { moderator_email: moderator.email },
    },
  });
  return updated;
}
