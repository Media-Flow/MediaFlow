import { Global, Module } from '@nestjs/common';
import { AppLogger } from './app-logger.service';
import { APP_LOGGER } from '../../application/ports/logger.port';

@Global()
@Module({
  providers: [AppLogger, { provide: APP_LOGGER, useExisting: AppLogger }],
  exports: [APP_LOGGER],
})
export class LoggingModule {}
