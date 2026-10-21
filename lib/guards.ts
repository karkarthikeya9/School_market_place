import { getSession, type SessionUser } from './auth';
import { prisma } from './db';
import { Errors } from './errors';

export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) throw Errors.unauthorized();
  return session;
}

/** Load the DB user for the session, enforcing that the account is active. */
export async function requireActiveUser() {
  const session = await requireSession();
  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user) throw Errors.unauthorized();
  if (user.status !== 'ACTIVE') throw Errors.forbidden('Account is suspended');
  return { session, user };
}

export async function requireAdmin() {
  const { session, user } = await requireActiveUser();
  if (user.role !== 'ADMIN') throw Errors.forbidden('Administrator access required');
  return { session, user };
}
