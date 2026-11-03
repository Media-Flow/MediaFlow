import type { Event } from '../../domain/event.entity';
import type { DrizzleDB } from '../../../shared/infrastructure/database/postgres/drizzle.provider';

export const EVENT_REPOSITORY = Symbol('EVENT_REPOSITORY');
type DbOrTxn =
  DrizzleDB | Parameters<Parameters<DrizzleDB['transaction']>[0]>[0];

export interface EventRepositoryPort {
  save(event: Event): Promise<void>;
  updateState(event: Event, txn: DbOrTxn): Promise<void>;
  findUnpublished(limit: number, txn: DbOrTxn): Promise<Event[]>;
}
