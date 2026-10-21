import { prisma } from '@/lib/db';
import { toSellerPublic } from '@/lib/dto';
import { Errors } from '@/lib/errors';
import { ok, withError } from '@/lib/http';

export const dynamic = 'force-dynamic';

export function GET(_req: Request, ctx: { params: Promise<{ sellerId: string }> }) {
  return withError(async () => {
    const { sellerId } = await ctx.params;

    const user = await prisma.user.findUnique({
      where: { id: sellerId },
      include: { profile: { include: { university: true } } },
    });
    if (!user || user.status !== 'ACTIVE') throw Errors.notFound('Seller not found');

    const activeListingCount = await prisma.listing.count({
      where: { sellerId, status: 'ACTIVE' },
    });

    return ok(toSellerPublic(user, activeListingCount));
  });
}
