import { prisma } from '@/lib/db';
import { toWishlistItem } from '@/lib/dto';
import { Errors } from '@/lib/errors';
import { requireActiveUser } from '@/lib/guards';
import { ok, parseBody, withError } from '@/lib/http';
import { wishlistAddSchema } from '@/shared/schemas';

export const dynamic = 'force-dynamic';

const listingIncludeForWishlist = {
  listing: { include: { images: { orderBy: { position: 'asc' as const }, take: 1 } } },
};

export function GET() {
  return withError(async () => {
    const { user } = await requireActiveUser();
    const items = await prisma.wishlistItem.findMany({
      where: { userId: user.id },
      include: listingIncludeForWishlist,
      orderBy: { createdAt: 'desc' },
    });
    return ok({ items: items.map(toWishlistItem) });
  });
}

export function POST(req: Request) {
  return withError(async () => {
    const { user } = await requireActiveUser();
    const body = await parseBody(req, wishlistAddSchema);

    const listing = await prisma.listing.findUnique({ where: { id: body.listing_id } });
    if (!listing || listing.status !== 'ACTIVE') {
      throw Errors.notFound('Listing is not available');
    }

    const existing = await prisma.wishlistItem.findUnique({
      where: { userId_listingId: { userId: user.id, listingId: body.listing_id } },
      include: listingIncludeForWishlist,
    });
    if (existing) return ok(toWishlistItem(existing));

    const created = await prisma.wishlistItem.create({
      data: { userId: user.id, listingId: body.listing_id },
      include: listingIncludeForWishlist,
    });
    return ok(toWishlistItem(created), 201);
  });
}
