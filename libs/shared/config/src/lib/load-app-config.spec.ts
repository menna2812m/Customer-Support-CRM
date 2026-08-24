import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadAppConfig } from './load-app-config';

const valid = {
  apiBaseUrl: 'https://api.example.test',
  socketUrl: 'wss://api.example.test/ws',
  enabledChannels: [],
  enabledAiCapabilities: [],
  featureFlagDefaults: {},
};

const respondWith = (body: unknown, ok = true) =>
  vi.fn().mockResolvedValue({ ok, status: ok ? 200 : 500, json: async () => body } as Response);

afterEach(() => vi.unstubAllGlobals());

describe('loadAppConfig', () => {
  it('loads and returns the configuration document', async () => {
    vi.stubGlobal('fetch', respondWith(valid));
    await expect(loadAppConfig()).resolves.toEqual(valid);
  });

  it('requests /config.json by default', async () => {
    const fetchMock = respondWith(valid);
    vi.stubGlobal('fetch', fetchMock);
    await loadAppConfig();
    expect(fetchMock).toHaveBeenCalledWith('/config.json', { cache: 'no-store' });
  });

  it('fails when a required field is missing', async () => {
    vi.stubGlobal('fetch', respondWith({ ...valid, apiBaseUrl: undefined }));
    await expect(loadAppConfig()).rejects.toThrowError(/apiBaseUrl/);
  });

  it('fails when the document carries a secret', async () => {
    vi.stubGlobal('fetch', respondWith({ ...valid, clientSecret: 'x' }));
    await expect(loadAppConfig()).rejects.toThrowError(/must not contain secrets/i);
  });

  it('fails when the request is unsuccessful', async () => {
    vi.stubGlobal('fetch', respondWith({}, false));
    await expect(loadAppConfig()).rejects.toThrowError(/could not be loaded/i);
  });
});
