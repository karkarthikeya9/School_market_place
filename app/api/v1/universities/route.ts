import { prisma } from '@/lib/db';
import { ok, withError } from '@/lib/http';

export const dynamic = 'force-dynamic';

export function GET() {
  return withError(async () => {
    const universities = await prisma.university.findMany({ orderBy: { name: 'asc' } });
    return ok({ items: universities.map((u) => ({ id: u.id, name: u.name })) });
  });
}
