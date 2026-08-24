import { describe, expect, it } from 'vitest';
import { assertNoSecrets, type AppConfig } from './app-config';

const base: AppConfig = {
  apiBaseUrl: 'https://api.example.test',
  socketUrl: 'wss://api.example.test/ws',
  enabledChannels: ['email'],
  enabledAiCapabilities: [],
  featureFlagDefaults: {},
};

describe('assertNoSecrets', () => {
  it('accepts a configuration containing only public values', () => {
    expect(() => assertNoSecrets(base)).not.toThrow();
  });

  it.each([
    'apiSecret',
    'clientSecret',
    'password',
    'privateKey',
    'accessToken',
    'apiKey',
    'credentials',
  ])('rejects a configuration carrying a "%s" key', (key) => {
    const polluted = { ...base, [key]: 'anything' } as unknown as AppConfig;
    expect(() => assertNoSecrets(polluted)).toThrowError(/public browser configuration/i);
  });

  it('detects secret-shaped keys nested inside objects', () => {
    const polluted = {
      ...base,
      featureFlagDefaults: { nested: true },
      extra: { deeper: { clientSecret: 'x' } },
    } as unknown as AppConfig;
    expect(() => assertNoSecrets(polluted)).toThrowError(/clientSecret/);
  });
});
