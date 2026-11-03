import {
  AuthenticatedIdentity,
  AuthServicePort,
  RefreshedSession,
  VerifiedSession,
} from '../../application/ports/auth.port';
import { decodeJwt } from 'jose';
import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { WORKOS_PROVIDER } from '../../../shared/infrastructure/auth/workos/workos.provider';
import {
  AuthenticationException,
  BadRequestException as WorkosBadRequestException,
  OauthException,
  WorkOS,
} from '@workos-inc/node';
import { ConfigService } from '@nestjs/config';
import { APP_LOGGER } from '../../../shared/application/ports/logger.port';
import type { LoggerPort } from '../../../shared/application/ports/logger.port';
@Injectable()
export class WorkosAuthProvider implements AuthServicePort {
  constructor(
    @Inject(WORKOS_PROVIDER) private readonly workos: WorkOS,
    private readonly configService: ConfigService,
    @Inject(APP_LOGGER) private readonly logger: LoggerPort,
  ) {}
  login(state?: string): string {
    return this.workos.userManagement.getAuthorizationUrl({
      provider: 'authkit',
      clientId: this.configService.getOrThrow('WORKOS_CLIENT_ID'),
      redirectUri: this.configService.getOrThrow('WORKOS_REDIRECT_URI'),
      state,
    });
  }

  async authenticateWithCode(code: string): Promise<AuthenticatedIdentity> {
    const { sealedSession, user } = await this.workos.userManagement
      .authenticateWithCode({
        code,
        clientId: this.configService.getOrThrow('WORKOS_CLIENT_ID'),
        session: {
          sealSession: true,
          cookiePassword: this.configService.getOrThrow(
            'WORKOS_COOKIE_PASSWORD',
          ),
        },
      })
      .catch((error: unknown) => {
        if (
          error instanceof OauthException ||
          error instanceof WorkosBadRequestException ||
          error instanceof AuthenticationException
        ) {
          throw new BadRequestException('Invalid authorization code');
        }
        throw error;
      });

    if (!sealedSession) {
      throw new InternalServerErrorException(
        'Auth Provider did not return a sealed session',
      );
    }

    this.logger.log(
      WorkosAuthProvider.name,
      'WorkOS authorization code authenticated successfully',
    );

    return {
      sealedSession,
      externalId: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }

  async verifySession(sealedSession: string): Promise<VerifiedSession> {
    const session = this.workos.userManagement.loadSealedSession({
      sessionData: sealedSession,
      cookiePassword: this.configService.getOrThrow('WORKOS_COOKIE_PASSWORD'),
    });
    const authResponse = await session.authenticate();
    if (authResponse.authenticated) {
      return {
        authenticated: true,
        externalId: authResponse.user.id,
        appUserId: this.extractAppUserId(authResponse.accessToken),
        role: this.extractRole(authResponse.accessToken),
      };
    } else {
      return {
        authenticated: false,
        reason: authResponse.reason,
      };
    }
  }

  async refreshSession(sealedSession: string): Promise<RefreshedSession> {
    const session = this.workos.userManagement.loadSealedSession({
      sessionData: sealedSession,
      cookiePassword: this.configService.getOrThrow('WORKOS_COOKIE_PASSWORD'),
    });

    const result = await session.refresh();
    if (result.authenticated) {
      return {
        authenticated: true,
        externalId: result.user.id,
        sealedSession: result.sealedSession,
        role: this.extractRole(result.session?.accessToken),
        appUserId: this.extractAppUserId(result.session?.accessToken),
      };
    } else if (result.retryable) {
      this.logger.warn(
        WorkosAuthProvider.name,
        'Transient WorkOS session refresh failure; session preserved',
      );
      return { authenticated: false, retryable: true };
    } else {
      return { authenticated: false, retryable: false };
    }
  }

  async logout(sealedSession: string, returnTo?: string): Promise<string> {
    const session = this.workos.userManagement.loadSealedSession({
      sessionData: sealedSession,
      cookiePassword: this.configService.getOrThrow('WORKOS_COOKIE_PASSWORD'),
    });

    const authResult = await session.authenticate();

    if (!authResult.authenticated) {
      return returnTo ?? this.configService.getOrThrow('APP_LOGIN_URL');
    }

    return this.workos.userManagement.getLogoutUrl({
      sessionId: authResult.sessionId,
      returnTo,
    });
  }
  private extractRole(accessToken?: string): string | undefined {
    if (!accessToken) return undefined;
    return decodeJwt(accessToken)['urn:myapp:role'] as string | undefined;
  }
  private extractAppUserId(accessToken?: string): string | undefined {
    if (!accessToken) return undefined;
    return decodeJwt(accessToken)['urn:myapp:app_user_id'] as
      string | undefined;
  }
}
