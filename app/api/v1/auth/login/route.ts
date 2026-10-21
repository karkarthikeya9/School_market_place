import { createSessionToken, setSessionCookie, verifyPassword } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { toUser } from '@/lib/dto';
import { Errors } from '@/lib/errors';
import { ok, parseBody, withError } from '@/lib/http';
import { rateLimit } from '@/lib/rate-limit';
import { loginSchema } from '@/shared/schemas';

export const dynamic = 'force-dynamic';

export function POST(req: Request) {
  return withError(async () => {
    const ip = (req.headers.get('x-forwarded-for') ?? 'unknown').split(',')[0].trim();
    rateLimit('login', ip, 10);

    const body = await parseBody(req, loginSchema);
    rateLimit('login-email', body.email, 10);

    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user) throw Errors.unauthorized('Invalid email or password');

    const valid = await verifyPassword(body.password, user.passwordHash);
    if (!valid) throw Errors.unauthorized('Invalid email or password');

    if (user.status !== 'ACTIVE') throw Errors.forbidden('This account has been suspended');

    await setSessionCookie(
      await createSessionToken({ id: user.id, role: user.role, email: user.email }),
    );
    const full = await prisma.user.findUnique({
      where: { id: user.id },
      include: { profile: true },
    });
    return ok({ user: toUser(full) });
  });
}
