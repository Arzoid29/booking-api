import { ConflictException, Injectable } from '@nestjs/common';

import { CreateBookingDto } from './dto/create-booking.dto';
import { CalendarService } from '../calendar/calendar.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService, private calendar: CalendarService) {}

  async create(userId: string, dto: CreateBookingDto) {
    const start = new Date(dto.startAt);
    const end = new Date(dto.endAt);
    if (!(start < end)) throw new ConflictException('Invalid time range');

    const overlap = await this.prisma.booking.findFirst({
      where: {
        AND: [{ userId }, { startAt: { lt: end } }, { endAt: { gt: start } }],
      },
    });
    if (overlap) throw new ConflictException('Overlaps an existing booking');

    const hasCalendarConflicts = await this.calendar.hasConflicts(userId, start, end);
    if (hasCalendarConflicts) throw new ConflictException('Conflicts with Google Calendar');

    return this.prisma.booking.create({
      data: { userId, title: dto.title, startAt: start, endAt: end },
    });
  }

  listMine(userId: string) {
    return this.prisma.booking.findMany({
      where: { userId },
      orderBy: { startAt: 'asc' },
    });
  }

  async remove(userId: string, id: string) {
    const found = await this.prisma.booking.findUnique({ where: { id } });
    if (!found || found.userId !== userId) return { ok: true }; // 
    await this.prisma.booking.delete({ where: { id } });
    return { ok: true };
  }
}
