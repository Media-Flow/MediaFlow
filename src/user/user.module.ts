import { Module } from '@nestjs/common';
import { USER_REPOSITORY } from './application/ports/user.repository.port';
import { DrizzleUserRepository } from './infrastructure/adapters/drizzle-user.repository';
import { RegisterUser } from './application/use-cases/register-user';
import { ListUsers } from './application/use-cases/list-users';
import { GetUser } from './application/use-cases/get-user';
import { DeleteUser } from './application/use-cases/delete-user';
import { UserController } from './presentation/user.controller';
import { IDENTITY_PROVIDER } from './application/ports/identity-provider.port';
import { WorkosIdentityProvider } from './infrastructure/adapters/WorkosIdentityProvider';

@Module({
  controllers: [UserController],
  providers: [
    RegisterUser,
    ListUsers,
    GetUser,
    DeleteUser,
    {
      provide: USER_REPOSITORY,
      useClass: DrizzleUserRepository,
    },
    {
      provide: IDENTITY_PROVIDER,
      useClass: WorkosIdentityProvider,
    },
  ],
  exports: [RegisterUser],
})
export class UserModule {}
