import { toUser } from '@/lib/dto';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/guards';
import { ok, withError } from '@/lib/http';
import { suspendUser } from '@/lib/listing-actions';

export const dynamic = 'force-dynamic';

export function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  return withError(async () => {
    const { id } = await ctx.params;
    const { user } = await requireAdmin();
    await suspendUser(id, { id: user.id, role: 'ADMIN', email: user.email });
    const updated = await prisma.user.findUnique({ where: { id }, include: { profile: true } });
    return ok(toUser(updated));
  });
}
