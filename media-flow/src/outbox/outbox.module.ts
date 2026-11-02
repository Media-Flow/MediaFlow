import { MessageQueueModule } from '../shared/infrastructure/queue/queue.module';
import { Module } from '@nestjs/common';
import { EVENT_REPOSITORY } from './application/ports/event.repository.port';
import { DrizzleEventRepository } from './infrastructure/adapters/drizzle-event.repository';
import { QUEUE } from './application/ports/queue.port';
import { RabbitMQAdapter } from './infrastructure/adapters/rabbitmq.adapter';
import { AddEvent } from './application/use-case/add-event';
@Module({
  imports: [MessageQueueModule],
  providers: [
    {
      provide: EVENT_REPOSITORY,
      useClass: DrizzleEventRepository,
    },
    AddEvent,
    {
      provide: QUEUE,
      useClass: RabbitMQAdapter,
    },
  ],
  exports: [AddEvent],
})
export class OutBoxModule {}
