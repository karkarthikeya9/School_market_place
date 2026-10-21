import { prisma } from '@/lib/db';
import { requireActiveUser } from '@/lib/guards';
import { ok, withError } from '@/lib/http';

export const dynamic = 'force-dynamic';

export function DELETE(_req: Request, ctx: { params: Promise<{ listingId: string }> }) {
  return withError(async () => {
    const { listingId } = await ctx.params;
    const { user } = await requireActiveUser();

    await prisma.wishlistItem.deleteMany({
      where: { userId: user.id, listingId },
    });

    return ok({ ok: true });
  });
}
