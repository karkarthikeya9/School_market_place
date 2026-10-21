import { prisma } from '@/lib/db';
import { Errors } from '@/lib/errors';
import { requireActiveUser } from '@/lib/guards';
import { ok, withError } from '@/lib/http';
import { deleteImage } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string; imageId: string }> },
) {
  return withError(async () => {
    const { id, imageId } = await ctx.params;
    const { user } = await requireActiveUser();

    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) throw Errors.notFound('Listing not found');
    if (listing.sellerId !== user.id) throw Errors.forbidden();

    const image = await prisma.listingImage.findUnique({ where: { id: imageId } });
    if (!image || image.listingId !== id) throw Errors.notFound('Image not found');

    await prisma.listingImage.delete({ where: { id: imageId } });
    await deleteImage(image.storageKey);

    return ok({ ok: true });
  });
}
