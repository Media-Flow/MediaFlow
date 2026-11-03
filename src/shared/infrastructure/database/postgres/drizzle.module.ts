import { Global, Inject, Module, OnApplicationShutdown } from '@nestjs/common';
import { DRIZZLE, DrizzleProvider } from './drizzle.provider';
import type { DrizzleDB } from './drizzle.provider';

@Global()
@Module({
  providers: [DrizzleProvider],
  exports: [DrizzleProvider],
})
export class DrizzleModule implements OnApplicationShutdown {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async onApplicationShutdown(): Promise<void> {
    await this.db.$client.end();
  }
}
