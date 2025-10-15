import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    private users: UsersService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {
    this.googleClient = new OAuth2Client(this.config.get('GOOGLE_CLIENT_ID'));
  }

  async verifyGoogleIdToken(idToken: string): Promise<TokenPayload> {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: this.config.get<string>('GOOGLE_CLIENT_ID'),
      });
      const payload = ticket.getPayload();
      if (!payload || !payload.sub || !payload.email) {
        throw new UnauthorizedException('Invalid Google token payload');
      }
      return payload;
    } catch {
      throw new UnauthorizedException('Invalid Google ID token');
    }
  }

  async loginWithGoogleIdToken(idToken: string) {
    const payload = await this.verifyGoogleIdToken(idToken);
    const user = await this.users.upsertGoogleUser({
      sub: payload.sub!, email: payload.email!, name: payload.name,
    });

    const token = await this.jwt.signAsync({ sub: user.id, email: user.email }, { expiresIn: '7d' });

    return { token, user: { id: user.id, email: user.email, name: user.name } };
  }
}
