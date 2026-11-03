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
import {
  createTestDb,
  findUsersByEmail,
  insertUserRow,
  TestDb,
  truncateAll,
} from './helpers/db';
import { expectSynced, seedUser, setRole } from './helpers/users';
import {
  authorizeAs,
  Emulator,
  emulatorClient,
  expireAccessToken,
  getSessionCookie,
  loginAs,
  startEmulator,
  useEmulatorEnv,
} from './helpers/workos';

const CLEARED_COOKIE = /^wos-session=;/;

describe('Auth (e2e)', () => {
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

  describe('GET /auth/login', () => {
    it('redirects to WorkOS authorize with client, redirect URI and state', async () => {
      const res = await request(http).get('/auth/login?state=xyz').expect(302);

      const url = new URL(res.headers.location);
      expect(url.origin).toBe(new URL(emulator.url).origin);
      expect(url.pathname).toBe('/user_management/authorize');
      expect(url.searchParams.get('client_id')).toBe(
        process.env.WORKOS_CLIENT_ID,
      );
      expect(url.searchParams.get('redirect_uri')).toBe(
        process.env.WORKOS_REDIRECT_URI,
      );
      expect(url.searchParams.get('state')).toBe('xyz');
    });
  });

  describe('GET /auth/callback', () => {
    it('first login registers the user, links it to WorkOS and starts a session', async () => {
      const identity = await workos.userManagement.createUser({
        email: 'new@example.com',
        firstName: 'New',
        lastName: 'User',
        emailVerified: true,
      });
      const code = await authorizeAs(http, identity.email);

      const res = await request(http)
        .get(`/auth/callback?code=${code}`)
        .expect(302);

      expect(res.headers.location).toBe('/user/me');
      const cookie = getSessionCookie(res)!;
      expect(cookie).toMatch(/HttpOnly/);
      expect(cookie).toMatch(/Secure/);
      expect(cookie).toMatch(/SameSite=Lax/);
      expect(cookie).toMatch(/Path=\//);

      const { row } = await expectSynced(db, workos, identity.id);
      expect(row).toMatchObject({
        email: 'new@example.com',
        role: Role.USER,
        firstName: 'New',
        lastName: 'User',
      });

      const me = await request(http)
        .get('/user/me')
        .set('Cookie', cookie.split(';')[0])
        .expect(200);
      expect(me.body).toMatchObject({ email: 'new@example.com' });
    });

    it('returning user keeps the same row and stays synced', async () => {
      const user = await seedUser(db, workos);

      await login(user);

      const rows = await findUsersByEmail(db, user.email);
      expect(rows.map((row) => row.id)).toEqual([user.id]);
      await expectSynced(db, workos, user.sub);
    });

    it('links an existing local user that has no WorkOS identity yet', async () => {
      const local = await insertUserRow(db, {
        email: 'invited@example.com',
        sub: null,
      });
      const identity = await workos.userManagement.createUser({
        email: local.email,
        firstName: local.firstName,
        lastName: local.lastName,
        emailVerified: true,
      });

      await login(identity);

      const { row } = await expectSynced(db, workos, identity.id);
      expect(row.id).toBe(local.id);
    });

    it('409 when the email already belongs to another identity', async () => {
      await insertUserRow(db, {
        email: 'taken@example.com',
        sub: 'user_someone_else',
      });
      const identity = await workos.userManagement.createUser({
        email: 'taken@example.com',
        emailVerified: true,
      });
      const code = await authorizeAs(http, identity.email);

      const res = await request(http)
        .get(`/auth/callback?code=${code}`)
        .expect(409);

      expect(getSessionCookie(res)).toBeUndefined();
    });

    it('400 without a code', async () => {
      await request(http).get('/auth/callback').expect(400);
    });

    it('400 for an unknown code', async () => {
      await request(http)
        .get('/auth/callback?code=not-a-real-code')
        .expect(400);
    });

    it('400 when a code is replayed', async () => {
      const user = await seedUser(db, workos);
      const code = await authorizeAs(http, user.email);

      await request(http).get(`/auth/callback?code=${code}`).expect(302);
      await request(http).get(`/auth/callback?code=${code}`).expect(400);
    });
  });

  describe('AuthGuard (probed via GET /user/me)', () => {
    it('401 without a session cookie', async () => {
      await request(http).get('/user/me').expect(401);
    });

    it('401 and clears an invalid session cookie', async () => {
      const res = await request(http)
        .get('/user/me')
        .set('Cookie', 'wos-session=not-a-real-session')
        .expect(401);

      expect(getSessionCookie(res)).toMatch(CLEARED_COOKIE);
    });

    it('refreshes an expired access token and rotates the cookie', async () => {
      const user = await seedUser(db, workos);
      const cookie = await login(user);
      expireAccessToken();

      const res = await request(http)
        .get('/user/me')
        .set('Cookie', cookie)
        .expect(200);

      expect(res.body).toMatchObject({ email: user.email });
      const rotated = getSessionCookie(res);
      expect(rotated).toBeDefined();
      expect(rotated!.split(';')[0]).not.toBe(cookie);
    });

    it('401 and clears the cookie once the session is revoked', async () => {
      const user = await seedUser(db, workos);
      const cookie = await login(user);
      const sessions = await (
        await workos.userManagement.listSessions(user.sub)
      ).autoPagination();
      for (const session of sessions) {
        await workos.userManagement.revokeSession({ sessionId: session.id });
      }
      expireAccessToken();

      const res = await request(http)
        .get('/user/me')
        .set('Cookie', cookie)
        .expect(401);

      expect(getSessionCookie(res)).toMatch(CLEARED_COOKIE);
    });
  });

  describe('RoleGuard (probed via GET /user/admin)', () => {
    it('403 for a USER', async () => {
      const cookie = await login(await seedUser(db, workos));

      await request(http).get('/user/admin').set('Cookie', cookie).expect(403);
    });

    it('200 for an ADMIN', async () => {
      const cookie = await login(
        await seedUser(db, workos, { role: Role.ADMIN }),
      );

      await request(http).get('/user/admin').set('Cookie', cookie).expect(200);
    });

    it('a role change applies after logging in again', async () => {
      const user = await seedUser(db, workos);
      const userCookie = await login(user);
      await request(http)
        .get('/user/admin')
        .set('Cookie', userCookie)
        .expect(403);

      const admin = await setRole(db, workos, user, Role.ADMIN);
      const adminCookie = await login(admin);

      await request(http)
        .get('/user/admin')
        .set('Cookie', adminCookie)
        .expect(200);
      await expectSynced(db, workos, admin.sub);
    });
  });

  describe('GET /auth/logout', () => {
    it('401 without a session', async () => {
      await request(http).get('/auth/logout').expect(401);
    });

    it('sends a logged-in user to the WorkOS logout URL for their session', async () => {
      const user = await seedUser(db, workos);
      const cookie = await login(user);
      const sessions = await (
        await workos.userManagement.listSessions(user.sub)
      ).autoPagination();
      expect(sessions).toHaveLength(1);

      const res = await request(http)
        .get('/auth/logout')
        .set('Cookie', cookie)
        .expect(302);

      const url = new URL(res.headers.location);
      expect(url.origin).toBe(new URL(emulator.url).origin);
      expect(url.pathname).toBe('/user_management/sessions/logout');
      expect(url.searchParams.get('session_id')).toBe(sessions[0].id);
      expect(url.searchParams.get('return_to')).toBe(process.env.APP_LOGIN_URL);
      expect(getSessionCookie(res)).toMatch(CLEARED_COOKIE);
    });
  });
});
