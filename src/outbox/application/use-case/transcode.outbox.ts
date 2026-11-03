import { Inject, Injectable } from '@nestjs/common';
import { QUEUE, type QueuePort } from '../ports/queue.port';
import { Cron } from '@nestjs/schedule';
import {
  EVENT_REPOSITORY,
  type EventRepositoryPort,
} from '../ports/event.repository.port';
import {
  APP_LOGGER,
  type LoggerPort,
} from '../../../shared/application/ports/logger.port';
import { DRIZZLE } from '../../../shared/infrastructure/database/postgres/drizzle.provider';
import type { DrizzleDB } from '../../../shared/infrastructure/database/postgres/drizzle.provider';

@Injectable()
export class TranscodeOutbox {
  constructor(
    @Inject(QUEUE) private readonly queue: QueuePort,
    @Inject(EVENT_REPOSITORY)
    private readonly eventRepository: EventRepositoryPort,
    @Inject(APP_LOGGER) private readonly logger: LoggerPort,
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
  ) {}

  @Cron('*/2 * * * * *')
  async execute(): Promise<void> {
    const ctx = TranscodeOutbox.name;
    try {
      await this.db.transaction(async (txn) => {
        const events = await this.eventRepository.findUnpublished(25, txn);
        let published = 0;

        for (const event of events) {
          try {
            await this.queue.push({
              EventId: event.id,
              MediaId: event.mediaId,
              SourceKey: event.payload.SourceKey,
            });
            event.markPublished();
            published++;
          } catch (err) {
            event.markFailed(err instanceof Error ? err.message : String(err));
            this.logger.error(
              ctx,
              `Publish failed eventId=${event.id} retries=${event.retries}`,
              err,
            );
          }
          await this.eventRepository.updateState(event, txn);
        }

        if (published > 0)
          this.logger.log(ctx, `Published ${published}/${events.length}`);
      });
    } catch (err) {
      this.logger.error(
        ctx,
        'Batch rolled back; events pushed in it will be sent again',
        err,
      );
    }
  }
}
