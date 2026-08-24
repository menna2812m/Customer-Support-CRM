import { http, HttpResponse } from 'msw';
import { PROVISIONAL_IDENTITY } from './fixtures';

export const handlers = [
  http.get('*/config.json', () =>
    HttpResponse.json({
      apiBaseUrl: 'http://localhost/api',
      socketUrl: 'ws://localhost/ws',
      enabledChannels: [],
      enabledAiCapabilities: [],
      featureFlagDefaults: {},
    }),
  ),

  http.get('*/api/me', () => HttpResponse.json(PROVISIONAL_IDENTITY)),
];
