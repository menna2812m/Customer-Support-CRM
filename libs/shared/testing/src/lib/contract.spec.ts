import { describe, expect, it } from 'vitest';
import { handlers } from './handlers';
import { validateAgainstContract } from './contract';

const invokeHandler = async (method: string, url: string): Promise<unknown> => {
  const response = await fetch(url, { method });
  return response.json();
};

describe('MSW handlers conform to the canonical contract', () => {
  it('exposes a handler for GET /me', () => {
    expect(handlers.length).toBeGreaterThan(0);
  });

  it('GET /me matches the Identity schema', async () => {
    const body = await invokeHandler('GET', 'http://localhost/api/me');
    expect(() => validateAgainstContract('Identity', body)).not.toThrow();
  });

  it('rejects a payload that violates the Identity schema', () => {
    expect(() => validateAgainstContract('Identity', { userId: 1 })).toThrowError(/Identity/);
  });

  it('rejects an unknown schema name', () => {
    expect(() => validateAgainstContract('NoSuchSchema', {})).toThrowError(/NoSuchSchema/);
  });

  it('accepts a well-formed Error envelope', () => {
    expect(() =>
      validateAgainstContract('Error', { code: 'ticket.not_found', message: 'Not found', traceId: 't-1' }),
    ).not.toThrow();
  });
});
