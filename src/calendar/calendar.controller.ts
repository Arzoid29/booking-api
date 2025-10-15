import { Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendar: CalendarService) {}

  @UseGuards(JwtAuthGuard)
  @Get('status')
  async status(@Req() req: any) {
    const connected = await this.calendar.isConnected(req.user.sub);
    return { connected };
  }

  @UseGuards(JwtAuthGuard)
  @Get('connect')
  connect(@Req() req: any) {
    const url = this.calendar.getAuthUrl(req.user.sub);
    return { url };
  }

  @Get('callback')
  async callback(@Query('code') code: string, @Query('state') state: string) {
    const userId = state;
    await this.calendar.handleCallback(userId, code);
    return 'Calendar connected. You can close this tab.';
  }

  @UseGuards(JwtAuthGuard)
  @Post('disconnect')
  async disconnect(@Req() req: any) {
    return this.calendar.disconnect(req.user.sub);
  }
}
