import { randomUUID } from 'node:crypto';
import { eq, getTableName, isTable, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../../src/shared/infrastructure/database/postgres/schema';
import { users } from '../../src/shared/infrastructure/database/postgres/schema';
import { Role } from '../../src/user/domain/constants';

export function createTestDb(url = process.env.DATABASE_URL) {
  const name = url && new URL(url).pathname.slice(1);
  if (!url || !name || !/test/i.test(name)) {
    throw new Error(
      `DATABASE_URL must point at a test database (got "${name}"), check .env.test`,
    );
  }
  return drizzle(postgres(url, { max: 2, onnotice: () => {} }), { schema });
}

export type TestDb = ReturnType<typeof createTestDb>;
export type UserRow = typeof users.$inferSelect;

const tableNames = Object.values(schema)
  .filter(isTable)
  .map((table) => `"${getTableName(table)}"`);

export async function truncateAll(db: TestDb): Promise<void> {
  await db.execute(
    sql.raw(`TRUNCATE TABLE ${tableNames.join(', ')} RESTART IDENTITY CASCADE`),
  );
}

export async function findUserBySub(
  db: TestDb,
  sub: string,
): Promise<UserRow | undefined> {
  const [row] = await db.select().from(users).where(eq(users.sub, sub));
  return row;
}

export async function findUsersByEmail(
  db: TestDb,
  email: string,
): Promise<UserRow[]> {
  return db.select().from(users).where(eq(users.email, email));
}

export async function insertUserRow(
  db: TestDb,
  values: { email: string; sub: string | null; role?: Role },
): Promise<UserRow> {
  const [row] = await db
    .insert(users)
    .values({
      id: randomUUID(),
      sub: values.sub,
      email: values.email,
      role: values.role ?? Role.USER,
      firstName: 'Local',
      lastName: 'User',
    })
    .returning();
  return row;
}
