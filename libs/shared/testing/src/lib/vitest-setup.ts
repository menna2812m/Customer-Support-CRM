import { afterAll, afterEach, beforeAll } from 'vitest';
import { primeContract } from './contract';
import { mswServer } from './msw-node';

beforeAll(async () => {
  await primeContract();
  mswServer.listen({ onUnhandledRequest: 'error' });
});
afterEach(() => mswServer.resetHandlers());
afterAll(() => mswServer.close());
