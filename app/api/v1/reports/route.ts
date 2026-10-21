import { prisma } from '@/lib/db';
import { toReport } from '@/lib/dto';
import { Errors } from '@/lib/errors';
import { requireActiveUser } from '@/lib/guards';
import { ok, parseBody, withError } from '@/lib/http';
import { reportCreateSchema } from '@/shared/schemas';

export const dynamic = 'force-dynamic';

export function POST(req: Request) {
  return withError(async () => {
    const { user } = await requireActiveUser();
    const body = await parseBody(req, reportCreateSchema);

    const listing = await prisma.listing.findUnique({ where: { id: body.listing_id } });
    if (!listing) throw Errors.notFound('Listing not found');

    const existing = await prisma.report.findUnique({
      where: { reporterId_listingId: { reporterId: user.id, listingId: body.listing_id } },
    });
    if (existing) return ok(toReport(existing));

    const report = await prisma.report.create({
      data: {
        reporterId: user.id,
        listingId: body.listing_id,
        reason: body.reason.toUpperCase() as never,
        note: body.note ?? null,
      },
    });
    return ok(toReport(report), 201);
  });
}
