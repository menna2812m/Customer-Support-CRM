import { HttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { APP_CONFIG } from '@crm/shared/config';
import {
  FRONTEND_REQUEST_ID_HEADER,
  provideHttpInfrastructure,
  SESSION_CREDENTIAL_PROVIDER,
} from '../index';

describe('provideHttpInfrastructure', () => {
  let http: HttpClient;
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: APP_CONFIG,
          useValue: {
            apiBaseUrl: 'http://localhost/api',
            socketUrl: 'ws://localhost/ws',
            enabledChannels: [],
            enabledAiCapabilities: [],
            featureFlagDefaults: {},
          },
        },
        provideHttpInfrastructure(),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  it('stamps a frontend request id on every outbound request', () => {
    http.get('/api/x').subscribe();
    const request = backend.expectOne('/api/x');
    expect(request.request.headers.get(FRONTEND_REQUEST_ID_HEADER)).toMatch(/[0-9a-f-]{36}/);
  });

  it('normalizes a failure into AppError before it reaches the caller', async () => {
    const promise = new Promise((_, reject) => http.get('/api/x').subscribe({ error: reject }));
    backend
      .expectOne('/api/x')
      .flush({ code: 'ticket.not_found', message: 'x', traceId: 't-1' }, { status: 404, statusText: 'NF' });

    await expect(promise).rejects.toMatchObject({
      code: 'ticket.not_found',
      httpStatus: 404,
      traceId: 't-1',
      retriable: false,
    });
  });

  it('defaults the session credential provider to a no-op so http stands alone', () => {
    const provider = TestBed.inject(SESSION_CREDENTIAL_PROVIDER);
    const unchanged = { headers: { keys: () => [] } } as never;
    expect(provider.authorize(unchanged)).toBe(unchanged);
  });
});
