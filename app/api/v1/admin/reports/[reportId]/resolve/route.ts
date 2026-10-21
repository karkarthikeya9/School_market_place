import { prisma } from '@/lib/db';
import { toReport } from '@/lib/dto';
import { Errors } from '@/lib/errors';
import { requireAdmin } from '@/lib/guards';
import { ok, parseBody, withError } from '@/lib/http';
import { resolveReportSchema } from '@/shared/schemas';

export const dynamic = 'force-dynamic';

export function POST(req: Request, ctx: { params: Promise<{ reportId: string }> }) {
  return withError(async () => {
    const { reportId } = await ctx.params;
    const { user } = await requireAdmin();
    const body = await parseBody(req, resolveReportSchema);

    const report = await prisma.report.findUnique({ where: { id: reportId } });
    if (!report) throw Errors.notFound('Report not found');

    const updated = await prisma.report.update({
      where: { id: reportId },
      data: {
        status: body.decision === 'resolved' ? 'RESOLVED' : 'DISMISSED',
        resolvedBy: user.id,
        resolvedAt: new Date(),
        ...(body.note ? { note: body.note } : {}),
      },
    });

    return ok(toReport(updated));
  });
}
