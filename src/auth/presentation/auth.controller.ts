import {
  BadRequestException,
  Controller,
  Get,
  Inject,
  Query,
  Redirect,
  Req,
  Res,
} from '@nestjs/common';
import { Authentication } from '../application/use-cases/authentication';
import type { Response, Request } from 'express';
import { Public } from '../../shared/presentation/decorator/public.decorator';
import { Logout } from '../application/use-cases/logout';
import { ConfigService } from '@nestjs/config';
import { APP_LOGGER } from '../../shared/application/ports/logger.port';
import type { LoggerPort } from '../../shared/application/ports/logger.port';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: Authentication,
    private readonly logoutUseCase: Logout,
    private readonly configService: ConfigService,
    @Inject(APP_LOGGER) private readonly logger: LoggerPort,
  ) {}

  @Public()
  @Get('login')
  @Redirect()
  login(@Query('state') state?: string) {
    return { url: this.loginUseCase.redirect(state) };
  }

  @Public()
  @Get('callback')
  @Redirect()
  async callback(
    @Query('code') code: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!code) {
      throw new BadRequestException('No code provided');
    }

    const { sealedSession } = await this.loginUseCase.callback(code);
    this.logger.log(AuthController.name, 'Authentication callback completed');
    res.cookie('wos-session', sealedSession, {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
    });
    return { url: '/user/me' };
  }

  @Get('logout')
  @Redirect()
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const sealedSession = request.cookies?.['wos-session'];
    response.clearCookie('wos-session');

    const returnTo: string =
      this.configService.getOrThrow<string>('APP_LOGIN_URL');

    const url = await this.logoutUseCase.execute(sealedSession, returnTo);
    this.logger.log(AuthController.name, 'Logout redirect generated');
    return { url };
  }

  //TODO: ADD WEBHOOK TO HANDLE USER UPDATES
}
