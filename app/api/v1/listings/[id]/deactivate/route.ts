import { toListing } from '@/lib/dto';
import { requireActiveUser } from '@/lib/guards';
import { ok, withError } from '@/lib/http';
import { deactivateListing } from '@/lib/listing-actions';

export const dynamic = 'force-dynamic';

export function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  return withError(async () => {
    const { id } = await ctx.params;
    const { user } = await requireActiveUser();
    const listing = await deactivateListing(id, { id: user.id, role: user.role });
    return ok(toListing(listing));
  });
}
