import { prisma } from '@/lib/db';
import { listingInclude, toListingSummary } from '@/lib/dto';
import { requireActiveUser } from '@/lib/guards';
import { ok, parseQuery, withError } from '@/lib/http';
import { paginationSchema } from '@/shared/schemas';

export const dynamic = 'force-dynamic';

export function GET(req: Request) {
  return withError(async () => {
    const { user } = await requireActiveUser();
    const params = parseQuery(new URL(req.url).searchParams, paginationSchema);

    const where = { sellerId: user.id };
    const [total, listings] = await Promise.all([
      prisma.listing.count({ where }),
      prisma.listing.findMany({
        where,
        include: listingInclude,
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.page_size,
        take: params.page_size,
      }),
    ]);

    return ok({
      items: listings.map(toListingSummary),
      page: params.page,
      page_size: params.page_size,
      total,
      total_pages: Math.max(1, Math.ceil(total / params.page_size)),
    });
  });
}
