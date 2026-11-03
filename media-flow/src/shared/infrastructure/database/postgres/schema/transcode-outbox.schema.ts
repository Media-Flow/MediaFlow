import {
  integer,
  jsonb,
  pgTable,
  timestamp,
  uuid,
  text,
  varchar,
} from 'drizzle-orm/pg-core';

export const transcodeOutboxSchema = pgTable('transcode_outbox', {
  id: uuid('id').primaryKey().defaultRandom(), //Event Id
  mediaId: uuid('media_id').notNull(),
  payload: jsonb('payload').notNull(),
  status: varchar('status').notNull().default('PENDING'),
  retries: integer('retries').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  publishedAt: timestamp('published_at'),
  failedAt: timestamp('failed_at'),
  lastError: text('last_error'),
});
