import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { AUTH_SERVICE } from '../ports/auth.port';
import type { AuthServicePort } from '../ports/auth.port';
import { RegisterUser } from '../../../user/application/use-cases/register-user';
import { User } from '../../../user/domain/user.entity';
import { APP_LOGGER } from '../../../shared/application/ports/logger.port';
import type { LoggerPort } from '../../../shared/application/ports/logger.port';

@Injectable()
export class Authentication {
  constructor(
    @Inject(AUTH_SERVICE) private readonly authService: AuthServicePort,
    private readonly registerUser: RegisterUser,
    @Inject(APP_LOGGER) private readonly logger: LoggerPort,
  ) {}

  redirect(state?: string): string {
    return this.authService.login(state);
  }

  async callback(code: string): Promise<{ sealedSession: string; user: User }> {
    const identity = await this.authService.authenticateWithCode(code);
    this.logger.log(
      Authentication.name,
      'Registering authenticated WorkOS user',
    );
    const user = await this.registerUser.execute({
      externalId: identity.externalId,
      firstName: identity.firstName ?? '',
      lastName: identity.lastName ?? '',
      email: identity.email,
    });

    const refreshed = await this.authService.refreshSession(
      identity.sealedSession,
    );

    if (
      !refreshed.authenticated ||
      !refreshed.sealedSession ||
      refreshed.appUserId !== user.id
    ) {
      throw new InternalServerErrorException(
        'Refreshed WorkOS session is missing the matching app user ID claim',
      );
    }

    this.logger.log(Authentication.name, 'User authentication completed');
    return { sealedSession: refreshed.sealedSession, user };
  }
}
