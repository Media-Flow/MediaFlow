import {
  bigint,
  boolean,
  integer,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const media = pgTable('Media', {
  id: uuid('id').primaryKey(),
  ownerId: uuid('owner_id').notNull(),
  title: varchar('title', { length: 256 }).default('').notNull(),
  description: varchar('description', { length: 256 }).default('').notNull(),
  mediaType: varchar('media_type'),
  totalParts: integer('total_parts').default(0).notNull(),
  uploadId: varchar('upload_id'),
  sourceKey: varchar('source_key').unique().notNull(),
  duration: integer('duration'),
  mediaSize: bigint('media_size', { mode: 'number' }).notNull(),
  status: varchar('status').notNull(),
  isPrivate: boolean('isPrivate').default(false).notNull(),
  isDeleted: boolean('isDeleted').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  statusUpdatedAt: timestamp('status_updated_at').defaultNow().notNull(),
});
