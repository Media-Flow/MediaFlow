import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { resolve } from 'node:path';
import { DrizzleModule } from './shared/infrastructure/database/postgres/drizzle.module';
import { UserModule } from './user/user.module';
import { MediaModule } from './media/media.module';
import { S3Module } from './shared/infrastructure/Storage/s3/s3.module';
import { WorkosModule } from './shared/infrastructure/auth/workos/workos.module';
import { AuthModule } from './auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './auth/presentation/guards/auth.guard';
import { RoleGuard } from './auth/presentation/guards/role.guard';
import { LoggingModule } from './shared/infrastructure/logging/logging.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: resolve(
        process.cwd(),
        process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
      ),
      isGlobal: true,
    }),
    DrizzleModule,
    LoggingModule,
    S3Module,
    WorkosModule,
    UserModule,
    MediaModule,
    AuthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RoleGuard },
  ],
})
export class AppModule {}
