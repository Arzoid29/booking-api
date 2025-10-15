import { Injectable, UnauthorizedException } from '@nestjs/common';
import { google } from 'googleapis';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CalendarService {
  constructor(private users: UsersService, private config: ConfigService) {}

  private oauth2() {
    return new google.auth.OAuth2(
      this.config.get('GOOGLE_CLIENT_ID'),
      this.config.get('GOOGLE_CLIENT_SECRET'),
      this.config.get('GOOGLE_REDIRECT_URI'),
    );
  }

  getAuthUrl(stateJwt: string) {
    const oauth2 = this.oauth2();
    const scope = ['https://www.googleapis.com/auth/calendar.readonly'];
    return oauth2.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope,
      state: stateJwt,
    });
  }

  async handleCallback(userId: string, code: string) {
    const oauth2 = this.oauth2();
    const { tokens } = await oauth2.getToken(code);
    if (!tokens.access_token) throw new UnauthorizedException('No access token');
    await this.users.saveCalendarTokens(userId, {
      access: tokens.access_token!,
      refresh: tokens.refresh_token ?? undefined,
      expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
    });
    return { ok: true };
  }


  async isConnected(userId: string) {
  const user = await this.users.getById(userId);
  return Boolean(user?.gcalAccess);
}

async disconnect(userId: string) {
  await this.users.saveCalendarTokens(userId, { access: "", refresh: undefined, expiryDate: undefined });
  await this.users.getById(userId); 
  return { ok: true };
}
  async hasConflicts(userId: string, start: Date, end: Date) {
    const user = await this.users.getById(userId);
    if (!user?.gcalAccess) return false;

    const oauth2 = this.oauth2();
    oauth2.setCredentials({
      access_token: user.gcalAccess!,
      refresh_token: user.gcalRefresh ?? undefined,
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2 });
    const res = await calendar.events.list({
      calendarId: 'primary',
      timeMin: start.toISOString(),
      timeMax: end.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 5,
    });

    const items = res.data.items ?? [];
    return items.length > 0;
  }
}
