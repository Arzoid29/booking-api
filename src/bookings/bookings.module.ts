import { Module } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { CalendarModule } from '../calendar/calendar.module';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  imports: [CalendarModule],
  controllers: [BookingsController],
  providers: [BookingsService, PrismaService],
})
export class BookingsModule {}
