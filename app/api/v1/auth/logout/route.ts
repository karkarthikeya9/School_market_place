import { clearSessionCookie } from '@/lib/auth';
import { ok, withError } from '@/lib/http';

export const dynamic = 'force-dynamic';

export function POST() {
  return withError(async () => {
    await clearSessionCookie();
    return ok({ ok: true });
  });
}
