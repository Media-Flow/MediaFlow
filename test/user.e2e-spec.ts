import { randomUUID } from 'node:crypto';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { WorkOS } from '@workos-inc/node';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { App } from 'supertest/types';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { AppModule } from '../src/app.module';
import { Role } from '../src/user/domain/constants';
import { createTestDb, findUserBySub, TestDb, truncateAll } from './helpers/db';
import { expectSynced, SeededUser, seedUser } from './helpers/users';
import {
  Emulator,
  emulatorClient,
  expireAccessToken,
  getSessionCookie,
  loginAs,
  startEmulator,
  useEmulatorEnv,
} from './helpers/workos';

const CLEARED_COOKIE = /^wos-session=;/;

interface UserPage {
  items: { id: string }[];
  nextCursor: string | null;
}

const asJson = (user: SeededUser) => ({
  id: user.id,
  sub: user.sub,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  role: user.role,
  isBlocked: false,
  createdAt: user.createdAt.toISOString(),
  updatedAt: user.createdAt.toISOString(),
});

describe('User (e2e)', () => {
  let db: TestDb;
  let emulator: Emulator;
  let workos: WorkOS;
  let app: INestApplication<App>;
  let http: App;

  beforeAll(async () => {
    db = createTestDb();
    emulator = await startEmulator();
    useEmulatorEnv(emulator);
    workos = emulatorClient(emulator);

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.use(cookieParser());
    await app.init();
    http = app.getHttpServer();
  });

  afterAll(async () => {
    await app?.close();
    await db?.$client.end();
    await emulator?.close();
  });

  beforeEach(async () => {
    await truncateAll(db);
    emulator.reset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const login = (user: { email: string }) => loginAs(http, user.email);

  const loginAsAdmin = async () => {
    const admin = await seedUser(db, workos, { role: Role.ADMIN });
    return { admin, cookie: await login(admin) };
  };

  const seedUsersOldestFirst = async (count: number) => {
    const start = Date.now() - (count + 60) * 1000;
    const seeded: SeededUser[] = [];
    for (let i = 0; i < count; i++) {
      seeded.push(
        await seedUser(db, workos, { createdAt: new Date(start + i * 1000) }),
      );
    }
    return seeded;
  };

  describe('access control', () => {
    const id = randomUUID();

    it.each([
      { method: 'get', path: '/user/me' },
      { method: 'get', path: '/user' },
      { method: 'get', path: `/user/${id}` },
      { method: 'delete', path: `/user/${id}` },
    ] as const)(
      '401 for $method $path without a session',
      async ({ method, path }) => {
        await request(http)[method](path).expect(401);
      },
    );

    it.each([
      { method: 'get', path: '/user' },
      { method: 'delete', path: `/user/${id}` },
    ] as const)('403 for $method $path as a USER', async ({ method, path }) => {
      const cookie = await login(await seedUser(db, workos));

      await request(http)[method](path).set('Cookie', cookie).expect(403);
    });
  });

  describe('GET /user/me', () => {
    it('returns the logged-in user, matching the DB and WorkOS', async () => {
      const user = await seedUser(db, workos, {
        firstName: 'Ahmed',
        lastName: 'Gamal',
      });
      const cookie = await login(user);

      const res = await request(http)
        .get('/user/me')
        .set('Cookie', cookie)
        .expect(200);

      expect(res.body).toEqual(asJson(user));
      await expectSynced(db, workos, user.sub);
    });
  });

  describe('GET /user', () => {
    it('lists every user newest first when they fit on one page', async () => {
      const seeded = await seedUsersOldestFirst(3);
      const { admin, cookie } = await loginAsAdmin();

      const res = await request(http)
        .get('/user')
        .set('Cookie', cookie)
        .expect(200);

      expect(res.body).toEqual({
        items: [admin, ...seeded.toReversed()].map(asJson),
        nextCursor: null,
      });
    });

    it('pages through every user exactly once with limit and cursor', async () => {
      const seeded = await seedUsersOldestFirst(5);
      const { admin, cookie } = await loginAsAdmin();

      const pages: string[][] = [];
      let cursor: string | null = null;
      do {
        const res = await request(http)
          .get('/user')
          .query(cursor ? { limit: 2, cursor } : { limit: 2 })
          .set('Cookie', cookie)
          .expect(200);
        const page = res.body as UserPage;
        pages.push(page.items.map((item) => item.id));
        cursor = page.nextCursor;
      } while (cursor);

      const newestFirst = [admin, ...seeded.toReversed()].map(
        (user) => user.id,
      );
      expect(pages).toEqual([
        newestFirst.slice(0, 2),
        newestFirst.slice(2, 4),
        newestFirst.slice(4, 6),
      ]);
    });

    it('returns 20 users per page by default', async () => {
      const seeded = await seedUsersOldestFirst(20);
      const { cookie } = await loginAsAdmin();

      const first = await request(http)
        .get('/user')
        .set('Cookie', cookie)
        .expect(200);
      const firstPage = first.body as UserPage;
      expect(firstPage.items).toHaveLength(20);
      expect(firstPage.nextCursor).not.toBeNull();

      const second = await request(http)
        .get('/user')
        .query({ cursor: firstPage.nextCursor })
        .set('Cookie', cookie)
        .expect(200);
      expect(second.body).toEqual({
        items: [asJson(seeded[0])],
        nextCursor: null,
      });
    });

    it('400 for an invalid cursor', async () => {
      const { cookie } = await loginAsAdmin();

      await request(http)
        .get('/user')
        .query({ cursor: 'not-a-cursor' })
        .set('Cookie', cookie)
        .expect(400);
    });

    it.each(['0', '101', 'abc'])('400 for limit=%s', async (limit) => {
      const { cookie } = await loginAsAdmin();

      await request(http)
        .get('/user')
        .query({ limit })
        .set('Cookie', cookie)
        .expect(400);
    });

    it('400 for an unknown query parameter', async () => {
      const { cookie } = await loginAsAdmin();

      await request(http)
        .get('/user')
        .query({ role: Role.ADMIN })
        .set('Cookie', cookie)
        .expect(400);
    });
  });

  describe('GET /user/:id', () => {
    it('returns the user', async () => {
      const user = await seedUser(db, workos);
      const cookie = await login(user);

      const res = await request(http)
        .get(`/user/${user.id}`)
        .set('Cookie', cookie)
        .expect(200);

      expect(res.body).toEqual(asJson(user));
    });

    it('404 for an unknown id', async () => {
      const cookie = await login(await seedUser(db, workos));

      await request(http)
        .get(`/user/${randomUUID()}`)
        .set('Cookie', cookie)
        .expect(404);
    });

    it('400 for a malformed id', async () => {
      const cookie = await login(await seedUser(db, workos));

      await request(http)
        .get('/user/not-a-uuid')
        .set('Cookie', cookie)
        .expect(400);
    });
  });

  describe('DELETE /user/:id', () => {
    it('removes the user from the DB and WorkOS', async () => {
      const target = await seedUser(db, workos);
      const { cookie } = await loginAsAdmin();

      await request(http)
        .delete(`/user/${target.id}`)
        .set('Cookie', cookie)
        .expect(204);

      expect(await findUserBySub(db, target.sub)).toBeUndefined();
      await expect(
        workos.userManagement.getUser(target.sub),
      ).rejects.toMatchObject({ status: 404 });
    });

    it("ends the deleted user's session", async () => {
      const target = await seedUser(db, workos);
      const targetCookie = await login(target);
      const { cookie } = await loginAsAdmin();

      await request(http)
        .delete(`/user/${target.id}`)
        .set('Cookie', cookie)
        .expect(204);

      await request(http)
        .get('/user/me')
        .set('Cookie', targetCookie)
        .expect(404);

      expireAccessToken();
      const res = await request(http)
        .get('/user/me')
        .set('Cookie', targetCookie)
        .expect(401);
      expect(getSessionCookie(res)).toMatch(CLEARED_COOKIE);
    });

    it('404 for an unknown id', async () => {
      const { cookie } = await loginAsAdmin();

      await request(http)
        .delete(`/user/${randomUUID()}`)
        .set('Cookie', cookie)
        .expect(404);
    });

    it('a USER cannot delete anyone, and the target stays synced', async () => {
      const target = await seedUser(db, workos);
      const cookie = await login(await seedUser(db, workos));

      await request(http)
        .delete(`/user/${target.id}`)
        .set('Cookie', cookie)
        .expect(403);

      await expectSynced(db, workos, target.sub);
    });
  });
});
