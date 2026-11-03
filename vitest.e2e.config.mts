import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.e2e-spec.ts'],
    // AppModule loads .env.test instead of .env.
    env: { NODE_ENV: 'test' },
    environment: 'node',
    pool: 'forks',
    // Specs share the test database.
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 30_000,
    // App logs are only shown for failing tests.
    silent: 'passed-only',
    // Printed on every emulator.reset(); irrelevant because no test relies
    // on WorkOS authentication events.
    onConsoleLog: (log) => !log.includes('EventBus reset limitation'),
  },
  plugins: [swc.vite({ module: { type: 'es6' } })],
});
