import { toListing } from '@/lib/dto';
import { requireAdmin } from '@/lib/guards';
import { ok, parseBody, withError } from '@/lib/http';
import { moderateListing } from '@/lib/listing-actions';
import { moderateSchema } from '@/shared/schemas';

export const dynamic = 'force-dynamic';

export function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return withError(async () => {
    const { id } = await ctx.params;
    const { user } = await requireAdmin();
    const body = await parseBody(req, moderateSchema);

    const actionMap = {
      deactivate: 'DEACTIVATE',
      reactivate: 'REACTIVATE',
      remove: 'REMOVE',
    } as const;

    const listing = await moderateListing(
      id,
      { id: user.id, role: 'ADMIN', email: user.email },
      actionMap[body.action],
      body.reason,
    );
    return ok(toListing(listing));
  });
}
