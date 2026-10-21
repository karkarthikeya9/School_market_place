import { createSessionToken, hashPassword, setSessionCookie } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { toUser } from '@/lib/dto';
import { Errors } from '@/lib/errors';
import { ok, parseBody, withError } from '@/lib/http';
import { rateLimit } from '@/lib/rate-limit';
import { registerSchema } from '@/shared/schemas';

export const dynamic = 'force-dynamic';

export function POST(req: Request) {
  return withError(async () => {
    const ip = (req.headers.get('x-forwarded-for') ?? 'unknown').split(',')[0].trim();
    rateLimit('register', ip, 10);

    const body = await parseBody(req, registerSchema);

    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) throw Errors.conflict('An account with this email already exists');

    const passwordHash = await hashPassword(body.password);
    const user = await prisma.user.create({
      data: {
        email: body.email,
        passwordHash,
        // MVP: no out-of-band email verification flow (see docs/open-questions.md OQ-7).
        emailVerifiedAt: new Date(),
        profile: { create: { displayName: body.display_name } },
      },
      include: { profile: true },
    });

    await setSessionCookie(
      await createSessionToken({ id: user.id, role: user.role, email: user.email }),
    );
    return ok(toUser(user), 201);
  });
}
