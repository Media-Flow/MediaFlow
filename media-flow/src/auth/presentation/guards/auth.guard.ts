import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {
  AUTH_SERVICE,
  type AuthServicePort,
  VerifiedSession,
} from '../../application/ports/auth.port';
import type { Response } from 'express';
import { AuthenticatedRequest } from './authenticated-request';
import { Reflector } from '@nestjs/core';
import { Public } from '../../../shared/presentation/decorator/public.decorator';
import { APP_LOGGER } from '../../../shared/application/ports/logger.port';
import type { LoggerPort } from '../../../shared/application/ports/logger.port';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(AUTH_SERVICE) private readonly authService: AuthServicePort,
    private readonly reflector: Reflector,
    @Inject(APP_LOGGER) private readonly logger: LoggerPort,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (this.reflector.get(Public, context.getHandler())) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const response: Response = context.switchToHttp().getResponse();
    const sealedSession = request.cookies?.['wos-session'];

    if (!sealedSession) {
      this.logger.warn(
        AuthGuard.name,
        'Authentication rejected: session cookie is missing',
      );
      throw new UnauthorizedException('No such session found');
    }

    let session: VerifiedSession =
      await this.authService.verifySession(sealedSession);

    if (!session.authenticated) {
      const refreshed = await this.authService.refreshSession(sealedSession);
      if (
        !refreshed.authenticated ||
        !refreshed.externalId ||
        !refreshed.appUserId ||
        !refreshed.sealedSession
      ) {
        if (!refreshed.retryable) {
          response.clearCookie('wos-session');
        }
        throw new UnauthorizedException();
      }

      response.cookie('wos-session', refreshed.sealedSession, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
      });
      session = {
        authenticated: true,
        externalId: refreshed.externalId,
        role: refreshed.role,
        appUserId: refreshed.appUserId,
      };
    }

    if (!session.authenticated || !session.externalId || !session.appUserId) {
      throw new UnauthorizedException();
    }
    request.user = {
      externalId: session.externalId,
      appUserId: session.appUserId,
      role: session.role,
    };
    return true;
  }
}
