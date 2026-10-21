import { prisma } from '@/lib/db';
import { Errors } from '@/lib/errors';
import { requireActiveUser } from '@/lib/guards';
import { ok, withError } from '@/lib/http';
import { validateImage, uploadListingImage } from '@/lib/storage';

export const dynamic = 'force-dynamic';

const MAX_IMAGES = 5;

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return withError(async () => {
    const { id } = await ctx.params;
    const { user } = await requireActiveUser();

    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) throw Errors.notFound('Listing not found');
    if (listing.sellerId !== user.id) throw Errors.forbidden();
    if (listing.status === 'SOLD' || listing.status === 'REMOVED') {
      throw Errors.conflict('Images cannot be changed on this listing');
    }

    const count = await prisma.listingImage.count({ where: { listingId: id } });
    if (count >= MAX_IMAGES) throw Errors.validation(`Maximum ${MAX_IMAGES} images allowed`);

    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) throw Errors.validation('A "file" field is required');
    const buffer = Buffer.from(await file.arrayBuffer());

    const detected = validateImage(buffer);
    const { storageKey, url } = await uploadListingImage(id, buffer, detected);

    const max = await prisma.listingImage.aggregate({ where: { listingId: id }, _max: { position: true } });
    const position = (max._max.position ?? -1) + 1;

    const image = await prisma.listingImage.create({
      data: { listingId: id, storageKey, url, position },
    });

    return ok({ id: image.id, url: image.url, position: image.position }, 201);
  });
}
