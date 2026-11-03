import {
  MediaRepositoryPort,
  MediaFilter,
} from '../../application/ports/media.repository.port';
import { Media, MediaStatus, MediaType } from '../../domain';
import type { Page, PageRequest } from '../../../shared/application/pagination';
import { DRIZZLE } from '../../../shared/infrastructure/database/postgres/drizzle.provider';
import type { DrizzleDB } from '../../../shared/infrastructure/database/postgres/drizzle.provider';
import { Inject, Injectable } from '@nestjs/common';
import { media } from '../../../shared/infrastructure/database/postgres/schema';
import { and, eq, inArray, or, SQL, lt, desc } from 'drizzle-orm';
import {
  decodeCreatedAtIdCursor,
  encodeCreatedAtIdCursor,
} from '../../../shared/infrastructure/database/postgres/cursor';
type MediaRow = typeof media.$inferSelect;
type MediaInsert = typeof media.$inferInsert;

export function toDomain(row: MediaRow): Media {
  return Media.reconstitute({
    id: row.id,
    ownerId: row.ownerId,
    title: row.title,
    description: row.description,
    type: row.mediaType as MediaType,
    uploadId: row.uploadId,
    totalParts: row.totalParts,
    sourceKey: row.sourceKey,
    duration: row.duration,
    size: row.mediaSize,
    status: row.status as MediaStatus,
    isPrivate: row.isPrivate,
    isDeleted: row.isDeleted,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    statusUpdatedAt: row.statusUpdatedAt,
  });
}

export function toPersistence(entity: Media): MediaInsert {
  return {
    id: entity.id,
    ownerId: entity.ownerId,
    title: entity.title,
    description: entity.description,
    mediaType: entity.type,
    uploadId: entity.uploadId,
    totalParts: entity.totalParts,
    sourceKey: entity.sourceKey,
    duration: entity.duration,
    mediaSize: entity.size,
    status: entity.status,
    isPrivate: entity.isPrivate,
    isDeleted: entity.isDeleted,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
    statusUpdatedAt: entity.statusUpdatedAt,
  };
}

@Injectable()
export class DrizzleMediaRepository implements MediaRepositoryPort {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}
  async delete(mediaId: string): Promise<void> {
    await this.db
      .update(media)
      .set({ isDeleted: true, updatedAt: new Date() })
      .where(eq(media.id, mediaId));
  }

  async save(entity: Media): Promise<void> {
    const values = toPersistence(entity);
    const { id, ...updateValues } = values;

    await this.db.insert(media).values(values).onConflictDoUpdate({
      target: media.id,
      set: updateValues,
    });
  }

  async findOne(mediaId: string, filter: MediaFilter): Promise<Media | null> {
    const [data] = await this.db
      .select()
      .from(media)
      .where(
        and(
          eq(media.id, mediaId),
          eq(media.isDeleted, false),
          ...this.applyFilter(filter),
        ),
      );

    if (!data) {
      return null;
    }

    return toDomain(data);
  }

  async findMany(
    filter: MediaFilter,
    pagination: PageRequest,
  ): Promise<Page<Media>> {
    const conditions: (SQL | undefined)[] = [
      eq(media.isDeleted, false),
      ...this.applyFilter(filter),
    ];

    if (pagination.cursor) {
      const { createdAt, id } = decodeCreatedAtIdCursor(pagination.cursor);
      conditions.push(
        or(
          lt(media.createdAt, createdAt),
          and(eq(media.createdAt, createdAt), lt(media.id, id)),
        ),
      );
    }

    const rows = await this.db
      .select()
      .from(media)
      .where(and(...conditions))
      .orderBy(desc(media.createdAt), desc(media.id))
      .limit(pagination.limit + 1);

    const hasMore = rows.length > pagination.limit;
    const pageRows = hasMore ? rows.slice(0, pagination.limit) : rows;
    const last = pageRows[pageRows.length - 1];

    return {
      items: pageRows.map((r) => toDomain(r)),
      nextCursor:
        hasMore && last
          ? encodeCreatedAtIdCursor(last.createdAt, last.id)
          : null,
    };
  }

  async findByTitle(title: string): Promise<Media[] | null> {
    title = title.toLowerCase();
    const data = await this.db
      .select()
      .from(media)
      .where(eq(media.title, title));
    return data.map((d) => toDomain(d));
  }

  private applyFilter(filter: MediaFilter): SQL[] {
    const conditios: SQL[] = [];
    if (filter.includePrivate === false) {
      conditios.push(eq(media.isPrivate, false));
    }
    if (filter.type) {
      conditios.push(eq(media.mediaType, filter.type));
    }
    if (filter.ownerId) {
      conditios.push(eq(media.ownerId, filter.ownerId));
    }
    if (filter.status?.length) {
      conditios.push(inArray(media.status, filter.status));
    }
    return conditios;
  }
}
