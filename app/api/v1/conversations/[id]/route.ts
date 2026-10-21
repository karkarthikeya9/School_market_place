import { prisma } from '@/lib/db';
import { conversationInclude, toConversation } from '@/lib/dto';
import { Errors } from '@/lib/errors';
import { requireActiveUser } from '@/lib/guards';
import { ok, withError } from '@/lib/http';

export const dynamic = 'force-dynamic';

export function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  return withError(async () => {
    const { id } = await ctx.params;
    const { user } = await requireActiveUser();

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: conversationInclude,
    });
    if (!conversation) throw Errors.notFound('Conversation not found');
    if (conversation.buyerId !== user.id && conversation.sellerId !== user.id) {
      throw Errors.forbidden();
    }

    return ok(toConversation(conversation, user.id));
  });
}
