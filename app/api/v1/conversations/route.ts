import { prisma } from '@/lib/db';
import { conversationInclude, toConversation } from '@/lib/dto';
import { Errors } from '@/lib/errors';
import { requireActiveUser } from '@/lib/guards';
import { ok, parseBody, parseQuery, withError } from '@/lib/http';
import { conversationCreateSchema, paginationSchema } from '@/shared/schemas';

export const dynamic = 'force-dynamic';

export function GET(req: Request) {
  return withError(async () => {
    const { user } = await requireActiveUser();
    const params = parseQuery(new URL(req.url).searchParams, paginationSchema);
    const where = { OR: [{ buyerId: user.id }, { sellerId: user.id }] };

    const [total, conversations] = await Promise.all([
      prisma.conversation.count({ where }),
      prisma.conversation.findMany({
        where,
        include: conversationInclude,
        orderBy: { updatedAt: 'desc' },
        skip: (params.page - 1) * params.page_size,
        take: params.page_size,
      }),
    ]);

    return ok({
      items: conversations.map((c) => toConversation(c, user.id)),
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
    const body = await parseBody(req, conversationCreateSchema);

    const listing = await prisma.listing.findUnique({ where: { id: body.listing_id } });
    if (!listing || listing.status !== 'ACTIVE') {
      throw Errors.notFound('This listing is not available for messaging');
    }
    if (listing.sellerId === user.id) {
      throw Errors.validation('You cannot message yourself about your own listing');
    }

    const existing = await prisma.conversation.findUnique({
      where: { listingId_buyerId: { listingId: body.listing_id, buyerId: user.id } },
      include: conversationInclude,
    });
    if (existing) return ok(toConversation(existing, user.id));

    const created = await prisma.conversation.create({
      data: { listingId: body.listing_id, buyerId: user.id, sellerId: listing.sellerId },
      include: conversationInclude,
    });
    return ok(toConversation(created, user.id), 201);
  });
}
