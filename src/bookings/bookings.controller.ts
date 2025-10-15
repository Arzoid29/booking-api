// src/bookings/bookings.controller.ts
import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@UseGuards(JwtAuthGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookings: BookingsService) {}

  @Get('me')
  listMine(@Req() req: any) {
    return this.bookings.listMine(req.user.sub);
  }

  @Post()
  create(@Req() req: any, @Body() dto: CreateBookingDto) {
    return this.bookings.create(req.user.sub, dto);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.bookings.remove(req.user.sub, id);
  }
}
