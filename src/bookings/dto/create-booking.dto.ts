import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class CreateBookingDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsDateString()
  startAt!: string;

  @IsDateString()
  endAt!: string;
}
