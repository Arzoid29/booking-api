import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CalendarModule } from './calendar/calendar.module';
import { BookingsModule } from './bookings/bookings.module';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    UsersModule,
    AuthModule,
    CalendarModule,
    BookingsModule,
  ],
})
export class AppModule {}
