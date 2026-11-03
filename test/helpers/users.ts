import { randomUUID } from 'node:crypto';
import type { WorkOS } from '@workos-inc/node';
import { eq } from 'drizzle-orm';
import { expect } from 'vitest';
import { users } from '../../src/shared/infrastructure/database/postgres/schema';
import { Role } from '../../src/user/domain/constants';
import { findUserBySub, TestDb } from './db';

export interface SeededUser {
  id: string;
  sub: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  createdAt: Date;
}

export interface SeedUserOptions {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: Role;
  createdAt?: Date;
}

export async function seedUser(
  db: TestDb,
  workos: WorkOS,
  opts: SeedUserOptions = {},
): Promise<SeededUser> {
  const id = randomUUID();
  const user = {
    id,
    email: opts.email ?? `e2e-${id}@example.com`,
    firstName: opts.firstName ?? 'Test',
    lastName: opts.lastName ?? 'User',
    role: opts.role ?? Role.USER,
    createdAt: opts.createdAt ?? new Date(),
  };

  const wosUser = await workos.userManagement.createUser({
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    emailVerified: true,
    externalId: user.id,
    metadata: { role: user.role },
  });
  await db.insert(users).values({
    id: user.id,
    sub: wosUser.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.createdAt,
  });

  return { ...user, sub: wosUser.id };
}

export async function setRole(
  db: TestDb,
  workos: WorkOS,
  user: SeededUser,
  role: Role,
): Promise<SeededUser> {
  await db.update(users).set({ role }).where(eq(users.id, user.id));
  await workos.userManagement.updateUser({
    userId: user.sub,
    metadata: { role },
  });
  return { ...user, role };
}

export async function expectSynced(db: TestDb, workos: WorkOS, sub: string) {
  const row = await findUserBySub(db, sub);
  if (!row) {
    throw new Error(`No DB user with sub ${sub}`);
  }
  const wosUser = await workos.userManagement.getUser(sub);

  expect(wosUser.externalId).toBe(row.id);
  expect(wosUser.email).toBe(row.email);
  expect(wosUser.metadata.role).toBe(row.role);
  expect(row.firstName).toBe(wosUser.firstName ?? '');
  expect(row.lastName).toBe(wosUser.lastName ?? '');

  return { row, wosUser };
}