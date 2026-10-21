import { prisma } from '@/lib/db';
import { toMessage } from '@/lib/dto';
import { Errors } from '@/lib/errors';
import { requireActiveUser } from '@/lib/guards';
import { ok, parseBody, parseQuery, withError } from '@/lib/http';
import { messageCreateSchema, messagesQuerySchema } from '@/shared/schemas';
import { rateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

async function participantConversation(id: string, userId: string) {
  const conversation = await prisma.conversation.findUnique({ where: { id } });
  if (!conversation) throw Errors.notFound('Conversation not found');
  if (conversation.buyerId !== userId && conversation.sellerId !== userId) {
    throw Errors.forbidden();
  }
  return conversation;
}

export function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return withError(async () => {
    const { id } = await ctx.params;
    const { user } = await requireActiveUser();
    await participantConversation(id, user.id);

    const params = parseQuery(new URL(req.url).searchParams, messagesQuerySchema);

    const where: { conversationId: string; createdAt?: { lt: Date } } = { conversationId: id };
    if (params.before) {
      const beforeMsg = await prisma.message.findUnique({ where: { id: params.before } });
      if (beforeMsg && beforeMsg.conversationId === id) {
        where.createdAt = { lt: beforeMsg.createdAt };
      }
    }

    const messages = await prisma.message.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: params.limit + 1,
    });

    const hasMore = messages.length > params.limit;
    const items = messages.slice(0, params.limit).map(toMessage);
    return ok({ items, has_more: hasMore });
  });
}

export function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return withError(async () => {
    const { id } = await ctx.params;
    const { user } = await requireActiveUser();
    await participantConversation(id, user.id);
    rateLimit('message', user.id, 60);

    const body = await parseBody(req, messageCreateSchema);

    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: { conversationId: id, senderId: user.id, body: body.body },
      }),
      // Bump the conversation's updatedAt so the thread list sorts by latest activity.
      prisma.conversation.update({ where: { id }, data: {} }),
    ]);

    return ok(toMessage(message), 201);
  });
}
