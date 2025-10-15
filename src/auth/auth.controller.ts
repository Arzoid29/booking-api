import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { GoogleAuthDto } from './dto/dto/google-auth.dto';


@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Post('google')
  google(@Body() dto: GoogleAuthDto) {
    return this.auth.loginWithGoogleIdToken(dto.idToken);
  }
}
