import { prisma } from '@/lib/db';
import { toReport } from '@/lib/dto';
import { requireAdmin } from '@/lib/guards';
import { ok, parseQuery, withError } from '@/lib/http';
import { reportsQuerySchema } from '@/shared/schemas';

export const dynamic = 'force-dynamic';

export function GET(req: Request) {
  return withError(async () => {
    await requireAdmin();
    const params = parseQuery(new URL(req.url).searchParams, reportsQuerySchema);

    const where = params.status ? { status: params.status.toUpperCase() as never } : {};
    const [total, reports] = await Promise.all([
      prisma.report.count({ where }),
      prisma.report.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.page_size,
        take: params.page_size,
      }),
    ]);

    return ok({
      items: reports.map(toReport),
      page: params.page,
      page_size: params.page_size,
      total,
      total_pages: Math.max(1, Math.ceil(total / params.page_size)),
    });
  });
}
