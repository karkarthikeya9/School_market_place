import { prisma } from '@/lib/db';
import { toCategory } from '@/lib/dto';
import { ok, withError } from '@/lib/http';

export const dynamic = 'force-dynamic';

export function GET() {
  return withError(async () => {
    const categories = await prisma.category.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] });
    const items = categories.map(toCategory);
    return ok({ items, page: 1, page_size: items.length, total: items.length, total_pages: 1 });
  });
}
