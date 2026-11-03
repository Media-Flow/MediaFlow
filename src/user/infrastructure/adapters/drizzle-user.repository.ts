import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, lt, or, SQL } from 'drizzle-orm';
import type { UserRepository } from '../../application/ports/user.repository.port';
import { User } from '../../domain/user.entity';
import { Role } from '../../domain/constants';
import type { Page, PageRequest } from '../../../shared/application/pagination';
import type { DrizzleDB } from '../../../shared/infrastructure/database/postgres/drizzle.provider';
import { DRIZZLE } from '../../../shared/infrastructure/database/postgres/drizzle.provider';
import { users } from '../../../shared/infrastructure/database/postgres/schema/users.schema';
import {
  decodeCreatedAtIdCursor,
  encodeCreatedAtIdCursor,
} from '../../../shared/infrastructure/database/postgres/cursor';

@Injectable()
export class DrizzleUserRepository implements UserRepository {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: DrizzleDB,
  ) {}

  async save(user: User): Promise<void> {
    const data = DrizzleUserRepository.toPersistence(user);

    await this.db
      .insert(users)
      .values(data)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          role: data.role,
          sub: data.sub,
          isBlocked: data.isBlocked,
        },
      });
  }

  async deleteUser(userId: string): Promise<void> {
    await this.db.delete(users).where(eq(users.id, userId));
  }

  async findAll(pagination: PageRequest): Promise<Page<User>> {
    const conditions: (SQL | undefined)[] = [];

    if (pagination.cursor) {
      const { createdAt, id } = decodeCreatedAtIdCursor(pagination.cursor);
      conditions.push(
        or(
          lt(users.createdAt, createdAt),
          and(eq(users.createdAt, createdAt), lt(users.id, id)),
        ),
      );
    }

    const rows = await this.db
      .select()
      .from(users)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(users.createdAt), desc(users.id))
      .limit(pagination.limit + 1);

    const hasMore = rows.length > pagination.limit;
    const pageRows = hasMore ? rows.slice(0, pagination.limit) : rows;
    const last = pageRows[pageRows.length - 1];

    return {
      items: pageRows.map(DrizzleUserRepository.toDomain),
      nextCursor:
        hasMore && last
          ? encodeCreatedAtIdCursor(last.createdAt, last.id)
          : null,
    };
  }

  async findByEmail(email: string): Promise<User | null> {
    const [data] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (!data) {
      return null;
    }

    return DrizzleUserRepository.toDomain(data);
  }

  async findById(userId: string): Promise<User | null> {
    const [data] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!data) {
      return null;
    }

    return DrizzleUserRepository.toDomain(data);
  }

  async findBySub(externalId: string): Promise<User | null> {
    const [data] = await this.db
      .select()
      .from(users)
      .where(eq(users.sub, externalId));

    if (!data) {
      return null;
    }

    return DrizzleUserRepository.toDomain(data);
  }

  static toPersistence(user: User): typeof users.$inferInsert {
    return {
      id: user.id,
      sub: user.sub,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isBlocked: user.isBlocked,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private static toDomain(row: typeof users.$inferSelect): User {
    return User.fromPersistence({
      id: row.id,
      sub: row.sub,
      email: row.email,
      firstName: row.firstName,
      lastName: row.lastName,
      role: row.role as Role,
      isBlocked: row.isBlocked ?? false,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
