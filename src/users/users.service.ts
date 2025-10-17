import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';


@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  findByGoogleSub(sub: string) {
    return this.prisma.user.findUnique({ where: { googleSub: sub } });
  }
  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  upsertGoogleUser(params: { sub: string; email: string; name?: string }) {
    const { sub, email, name } = params;
    return this.prisma.$transaction(async (tx) => {
      const bySub = await tx.user.findUnique({ where: { googleSub: sub } });
      if (bySub) {
        if (bySub.email !== email || bySub.name !== name) {
          return tx.user.update({ where: { id: bySub.id }, data: { email, name } });
        }
        return bySub;
      }
      const byEmail = await tx.user.findUnique({ where: { email } });
      if (byEmail) {
        return tx.user.update({
          where: { id: byEmail.id },
          data: { googleSub: sub, name: name ?? byEmail.name },
        });
      }
      return tx.user.create({ data: { googleSub: sub, email, name } });
    });
  }

  saveCalendarTokens(userId: string, tokens: { access: string; refresh?: string; expiryDate?: Date }) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        gcalAccess: tokens.access,
        gcalRefresh: tokens.refresh,
        gcalExpiry: tokens.expiryDate,
      },
    });
  }

  getById(userId: string) {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }
}
