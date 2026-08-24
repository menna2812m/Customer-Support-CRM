import { HttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  ACTIVE_SCOPE_PROVIDER,
  FRONTEND_REQUEST_ID_HEADER,
  LOCALE_PREFERENCE_PROVIDER,
  provideHttpInfrastructure,
  scopeBound,
  SESSION_CREDENTIAL_PROVIDER,
  type ActiveScope,
} from '../index';

// `shared/http` does not depend on `@crm/shared/config` / `APP_CONFIG`: nothing
// in this library reads the API base URL. Applying `apiBaseUrl` to outbound
// requests is an open item for whoever makes the first cross-origin call.
describe('provideHttpInfrastructure', () => {
  let http: HttpClient;
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpInfrastructure(), provideHttpClientTesting()],
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

/**
 * Scope attachment is OPT-IN per request, never global (spec section 8.3).
 * A request that does not opt in must go out completely unmodified — that
 * safety property has no other regression protection, so it is pinned here
 * through the real chain built by `provideHttpInfrastructure()`.
 */
describe('scope interceptor via provideHttpInfrastructure', () => {
  let backend: HttpTestingController;

  function harness(activeScope: ActiveScope | null) {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpInfrastructure(),
        provideHttpClientTesting(),
        { provide: ACTIVE_SCOPE_PROVIDER, useValue: { current: () => activeScope } },
      ],
    });
    const http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    return http;
  }

  it('carries no departmentId/branchId param when the request did not opt in', () => {
    const http = harness({ departmentId: 'dept-1', branchId: 'branch-1' });

    http.get('/api/x').subscribe();

    const request = backend.expectOne('/api/x');
    expect(request.request.params.has('departmentId')).toBe(false);
    expect(request.request.params.has('branchId')).toBe(false);
  });

  it('attaches departmentId and branchId when opted in with an active scope', () => {
    const http = harness({ departmentId: 'dept-1', branchId: 'branch-1' });

    http.get('/api/x', { context: scopeBound() }).subscribe();

    const request = backend.expectOne((r) => r.url === '/api/x');
    expect(request.request.params.get('departmentId')).toBe('dept-1');
    expect(request.request.params.get('branchId')).toBe('branch-1');
  });

  it('goes out unmodified when opted in but there is no active scope', () => {
    const http = harness(null);

    http.get('/api/x', { context: scopeBound() }).subscribe();

    const request = backend.expectOne('/api/x');
    expect(request.request.params.has('departmentId')).toBe(false);
    expect(request.request.params.has('branchId')).toBe(false);
  });

  it('does not disturb params the caller already set when opting in', () => {
    const http = harness({ departmentId: 'dept-1', branchId: 'branch-1' });

    http.get('/api/x', { context: scopeBound(), params: { foo: 'bar' } }).subscribe();

    const request = backend.expectOne((r) => r.url === '/api/x');
    expect(request.request.params.get('foo')).toBe('bar');
    expect(request.request.params.get('departmentId')).toBe('dept-1');
    expect(request.request.params.get('branchId')).toBe('branch-1');
  });
});

/** Locale header reflects whatever the locale preference provider reports. */
describe('locale interceptor via provideHttpInfrastructure', () => {
  it('sends Accept-Language from a custom LOCALE_PREFERENCE_PROVIDER', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpInfrastructure(),
        provideHttpClientTesting(),
        { provide: LOCALE_PREFERENCE_PROVIDER, useValue: { current: () => 'ar' } },
      ],
    });
    const http = TestBed.inject(HttpClient);
    const backend = TestBed.inject(HttpTestingController);

    http.get('/api/x').subscribe();

    const request = backend.expectOne('/api/x');
    expect(request.request.headers.get('Accept-Language')).toBe('ar');
  });

  it('sends the no-op default locale (en) when nothing overrides the provider', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpInfrastructure(), provideHttpClientTesting()],
    });
    const http = TestBed.inject(HttpClient);
    const backend = TestBed.inject(HttpTestingController);

    http.get('/api/x').subscribe();

    const request = backend.expectOne('/api/x');
    expect(request.request.headers.get('Accept-Language')).toBe('en');
  });
});
