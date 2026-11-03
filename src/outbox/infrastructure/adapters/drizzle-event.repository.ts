import { Inject, Injectable } from '@nestjs/common';
import { asc, eq, inArray } from 'drizzle-orm';
import type { EventRepositoryPort } from '../../application/ports/event.repository.port';
import { Event } from '../../domain/event.entity';
import { TranscodeOutboxStatus } from '../../domain/transcode-outbox-status';
import { DRIZZLE } from '../../../shared/infrastructure/database/postgres/drizzle.provider';
import type { DrizzleDB } from '../../../shared/infrastructure/database/postgres/drizzle.provider';
import { transcodeOutboxSchema } from '../../../shared/infrastructure/database/postgres/schema';
type DbOrTxn =
  DrizzleDB | Parameters<Parameters<DrizzleDB['transaction']>[0]>[0];

@Injectable()
export class DrizzleEventRepository implements EventRepositoryPort {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async save(event: Event): Promise<void> {
    await this.db.insert(transcodeOutboxSchema).values({
      id: event.id,
      mediaId: event.mediaId,
      payload: event.payload,
      status: event.status,
      retries: event.retries,
      createdAt: event.createdAt,
      publishedAt: event.publishedAt,
      failedAt: event.failedAt,
      lastError: event.lastError,
    });
  }

  async updateState(event: Event, txn: DbOrTxn): Promise<void> {
    await txn
      .update(transcodeOutboxSchema)
      .set({
        status: event.status,
        retries: event.retries,
        publishedAt: event.publishedAt,
        failedAt: event.failedAt,
        lastError: event.lastError,
      })
      .where(eq(transcodeOutboxSchema.id, event.id));
  }

  async findUnpublished(limit: number, txn: DbOrTxn): Promise<Event[]> {
    const rows = await txn
      .select()
      .from(transcodeOutboxSchema)
      .where(
        inArray(transcodeOutboxSchema.status, [
          TranscodeOutboxStatus.PENDING,
          TranscodeOutboxStatus.FAILED,
        ]),
      )
      .orderBy(
        asc(transcodeOutboxSchema.createdAt),
        asc(transcodeOutboxSchema.id),
      )
      .limit(limit)
      .for('update', { skipLocked: true });
    return rows.map((row) =>
      Event.reconstitute({
        id: row.id,
        mediaId: row.mediaId,
        payload: row.payload as Record<string, string>,
        status: row.status as TranscodeOutboxStatus,
        retries: row.retries,
        createdAt: row.createdAt,
        publishedAt: row.publishedAt,
        failedAt: row.failedAt,
        lastError: row.lastError,
      }),
    );
  }
}
