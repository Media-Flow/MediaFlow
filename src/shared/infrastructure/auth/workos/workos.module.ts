import { Global, Module } from '@nestjs/common';
import { WorkosProvider } from './workos.provider';

@Global()
@Module({
  providers: [WorkosProvider],
  exports: [WorkosProvider],
})
export class WorkosModule {}
