import type { Condition, Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { listingInclude, toListing, toListingSummary } from '@/lib/dto';
import { Errors } from '@/lib/errors';
import { requireActiveUser } from '@/lib/guards';
import { ok, parseBody, parseQuery, withError } from '@/lib/http';
import { createListingSchema, listingsQuerySchema } from '@/shared/schemas';
import { rupeesToMinor } from '@/shared/types';

export const dynamic = 'force-dynamic';

const VALID_CONDITIONS = new Set(['NEW', 'LIKE_NEW', 'VERY_GOOD', 'GOOD', 'ACCEPTABLE']);

function conditionValues(raw: string | undefined): Condition[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((c) => c.trim().toUpperCase())
    .filter((c): c is Condition => VALID_CONDITIONS.has(c));
}

export function GET(req: Request) {
  return withError(async () => {
    const params = parseQuery(new URL(req.url).searchParams, listingsQuerySchema);
    const conditions = conditionValues(params.condition);

    const where: Prisma.ListingWhereInput = { status: 'ACTIVE' };

    if (params.q) {
      where.OR = [
        { title: { contains: params.q, mode: 'insensitive' } },
        { description: { contains: params.q, mode: 'insensitive' } },
      ];
    }
    if (params.category_id) where.categoryId = params.category_id;
    else if (params.category) where.category = { slug: params.category };
    if (params.min_price !== undefined || params.max_price !== undefined) {
      where.priceMinor = {
        ...(params.min_price !== undefined ? { gte: rupeesToMinor(params.min_price) } : {}),
        ...(params.max_price !== undefined ? { lte: rupeesToMinor(params.max_price) } : {}),
      };
    }
    if (conditions.length > 0) where.condition = { in: conditions };

    let orderBy: Prisma.ListingOrderByWithRelationInput[] = [
      { publishedAt: 'desc' },
      { createdAt: 'desc' },
    ];
    if (params.sort === 'price_asc') orderBy = [{ priceMinor: 'asc' }];
    else if (params.sort === 'price_desc') orderBy = [{ priceMinor: 'desc' }];
    // 'relevance' (with q) and default 'newest' both sort by recency in the MVP;
    // true full-text ranking is a documented future enhancement.

    const [total, listings] = await Promise.all([
      prisma.listing.count({ where }),
      prisma.listing.findMany({
        where,
        include: listingInclude,
        orderBy,
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

export function POST(req: Request) {
  return withError(async () => {
    const { user } = await requireActiveUser();
    const body = await parseBody(req, createListingSchema);

    const category = await prisma.category.findUnique({ where: { id: body.category_id } });
    if (!category) throw Errors.validation('Invalid category');

    const listing = await prisma.listing.create({
      data: {
        sellerId: user.id,
        categoryId: body.category_id,
        title: body.title,
        description: body.description,
        priceMinor: rupeesToMinor(body.price),
        condition: body.condition.toUpperCase() as Condition,
        quantity: body.quantity,
        status: 'DRAFT',
      },
      include: listingInclude,
    });

    return ok(toListing(listing), 201);
  });
}
