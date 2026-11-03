import { Global, Module } from '@nestjs/common';
import { AUTH_SERVICE } from './application/ports/auth.port';
import { WorkosAuthProvider } from './infrastructure/adapters/workos-auth.adapter';
import { AuthController } from './presentation/auth.controller';
import { Authentication } from './application/use-cases/authentication';
import { UserModule } from '../user/user.module';
import { AuthGuard } from './presentation/guards/auth.guard';
import { RoleGuard } from './presentation/guards/role.guard';
import { Logout } from './application/use-cases/logout';

@Global()
@Module({
  imports: [UserModule],
  providers: [
    {
      provide: AUTH_SERVICE,
      useClass: WorkosAuthProvider,
    },
    Authentication,
    Logout,
    AuthGuard,
    RoleGuard,
  ],
  controllers: [AuthController],
  exports: [AUTH_SERVICE],
})
export class AuthModule {}
