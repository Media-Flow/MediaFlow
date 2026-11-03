import { createEmulator } from '@workos/emulate';
import { WorkOS } from '@workos-inc/node';
import request from 'supertest';
import type { App } from 'supertest/types';
import { vi } from 'vitest';

export type Emulator = Awaited<ReturnType<typeof createEmulator>>;

const JWT_TEMPLATE = JSON.stringify({
  'urn:myapp:app_user_id': '{{ user.external_id }}',
  'urn:myapp:role': '{{ user.metadata.role }}',
});

export function startEmulator(): Promise<Emulator> {
  return createEmulator({
    port: 0,
    seed: { jwtTemplate: { content: JWT_TEMPLATE } },
  });
}

export function useEmulatorEnv(emulator: Emulator): void {
  const url = new URL(emulator.url);
  process.env.WORKOS_API_KEY = emulator.apiKey;
  process.env.WORKOS_API_HOSTNAME = url.hostname;
  process.env.WORKOS_PORT = url.port;
  process.env.WORKOS_HTTPS = String(url.protocol === 'https:');
}

export function emulatorClient(emulator: Emulator): WorkOS {
  const url = new URL(emulator.url);
  return new WorkOS(emulator.apiKey, {
    clientId: process.env.WORKOS_CLIENT_ID,
    apiHostname: url.hostname,
    port: Number(url.port),
    https: url.protocol === 'https:',
  });
}

export function getSessionCookie(res: request.Response): string | undefined {
  const setCookie = res.headers['set-cookie'] as string[] | string | undefined;
  return [setCookie ?? []]
    .flat()
    .find((cookie) => cookie.startsWith('wos-session='));
}

export async function authorizeAs(http: App, email: string): Promise<string> {
  const loginRes = await request(http).get('/auth/login').expect(302);

  const authorizeUrl = new URL(loginRes.headers.location);
  authorizeUrl.searchParams.set('login_hint', email);
  const authorizeRes = await request(authorizeUrl.origin)
    .get(authorizeUrl.pathname + authorizeUrl.search)
    .expect(302);

  const code = new URL(authorizeRes.headers.location).searchParams.get('code');
  if (!code) {
    throw new Error(
      `Emulator returned no code: ${authorizeRes.headers.location}`,
    );
  }
  return code;
}

export async function loginAs(http: App, email: string): Promise<string> {
  const code = await authorizeAs(http, email);
  const res = await request(http)
    .get(`/auth/callback?code=${code}`)
    .expect(302);

  const cookie = getSessionCookie(res);
  if (!cookie) {
    throw new Error('Callback did not set a wos-session cookie');
  }
  return cookie.split(';')[0];
}

export function expireAccessToken(): void {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(Date.now() + 10 * 60_000);
}