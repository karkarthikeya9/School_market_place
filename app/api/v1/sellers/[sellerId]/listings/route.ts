import { prisma } from '@/lib/db';
import { listingInclude, toListingSummary } from '@/lib/dto';
import { ok, parseQuery, withError } from '@/lib/http';
import { paginationSchema } from '@/shared/schemas';

export const dynamic = 'force-dynamic';

export function GET(req: Request, ctx: { params: Promise<{ sellerId: string }> }) {
  return withError(async () => {
    const { sellerId } = await ctx.params;
    const params = parseQuery(new URL(req.url).searchParams, paginationSchema);

    const where = { sellerId, status: 'ACTIVE' as const };
    const [total, listings] = await Promise.all([
      prisma.listing.count({ where }),
      prisma.listing.findMany({
        where,
        include: listingInclude,
        orderBy: { publishedAt: 'desc' },
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
