import { toUser } from '@/lib/dto';
import { prisma } from '@/lib/db';
import { requireActiveUser, requireSession } from '@/lib/guards';
import { ok, parseBody, withError } from '@/lib/http';
import { updateProfileSchema } from '@/shared/schemas';

export const dynamic = 'force-dynamic';

export function GET() {
  return withError(async () => {
    const session = await requireSession();
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      include: { profile: true },
    });
    if (!user) return ok({}, 401);
    return ok(toUser(user));
  });
}

export function PATCH(req: Request) {
  return withError(async () => {
    const { user } = await requireActiveUser();
    const body = await parseBody(req, updateProfileSchema);

    const profile = await prisma.userProfile.update({
      where: { userId: user.id },
      data: {
        ...(body.display_name !== undefined ? { displayName: body.display_name } : {}),
        ...(body.bio !== undefined ? { bio: body.bio } : {}),
        ...(body.profile_image_url !== undefined
          ? { profileImageUrl: body.profile_image_url }
          : {}),
      },
      include: { university: true },
    });

    const full = await prisma.user.findUnique({
      where: { id: user.id },
      include: { profile: true },
    });
    return ok(toUser(full));
  });
}
