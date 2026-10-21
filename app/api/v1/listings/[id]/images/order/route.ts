import { prisma } from '@/lib/db';
import { Errors } from '@/lib/errors';
import { requireActiveUser } from '@/lib/guards';
import { ok, parseBody, withError } from '@/lib/http';
import { reorderImagesSchema } from '@/shared/schemas';

export const dynamic = 'force-dynamic';

export function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return withError(async () => {
    const { id } = await ctx.params;
    const { user } = await requireActiveUser();
    const body = await parseBody(req, reorderImagesSchema);

    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) throw Errors.notFound('Listing not found');
    if (listing.sellerId !== user.id) throw Errors.forbidden();

    const images = await prisma.listingImage.findMany({ where: { listingId: id } });
    const ids = new Set(images.map((i) => i.id));
    if (body.image_ids.length !== ids.size || body.image_ids.some((x) => !ids.has(x))) {
      throw Errors.validation('image_ids must be a permutation of this listing\'s images');
    }

    await prisma.$transaction(
      body.image_ids.map((imageId, position) =>
        prisma.listingImage.update({ where: { id: imageId }, data: { position } }),
      ),
    );

    const updated = await prisma.listingImage.findMany({
      where: { listingId: id },
      orderBy: { position: 'asc' },
    });
    return ok({ items: updated.map((i) => ({ id: i.id, url: i.url, position: i.position })) });
  });
}
