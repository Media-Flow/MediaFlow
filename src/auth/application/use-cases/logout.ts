import { Inject, Injectable } from '@nestjs/common';
import { AUTH_SERVICE, type AuthServicePort } from '../ports/auth.port';

@Injectable()
export class Logout {
  constructor(
    @Inject(AUTH_SERVICE) private readonly authService: AuthServicePort,
  ) {}

  async execute(sealedSession: string, returnTo?: string): Promise<string> {
    return this.authService.logout(sealedSession, returnTo);
  }
}
