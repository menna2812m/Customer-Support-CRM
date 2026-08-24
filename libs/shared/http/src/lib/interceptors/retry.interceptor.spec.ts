import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { retryInterceptor } from './retry.interceptor';

/**
 * `retryInterceptor` schedules retries with RxJS `timer()` (300ms base,
 * exponential, capped at 4000ms). Advancing microtasks with
 * `await Promise.resolve()` never advances a timer, so these tests use fake
 * timers and advance real elapsed time between attempts with
 * `vi.advanceTimersByTimeAsync`. This proves the actual backoff behavior
 * rather than sidestepping it.
 */
describe('retryInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([retryInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    backend.verify();
    vi.useRealTimers();
  });

  it('retries an idempotent GET on 503 and succeeds on the second attempt', async () => {
    const promise = new Promise((resolve) => http.get('/api/x').subscribe(resolve));

    backend.expectOne('/api/x').flush(null, { status: 503, statusText: 'Unavailable' });
    await vi.advanceTimersByTimeAsync(300);
    backend.expectOne('/api/x').flush({ ok: true });

    await expect(promise).resolves.toEqual({ ok: true });
  });

  it('does not retry a 400', async () => {
    const promise = new Promise((_, reject) => http.get('/api/x').subscribe({ error: reject }));
    backend.expectOne('/api/x').flush(null, { status: 400, statusText: 'Bad Request' });
    await expect(promise).rejects.toBeTruthy();
  });

  it('does not retry a non-idempotent POST even on 503', async () => {
    const promise = new Promise((_, reject) =>
      http.post('/api/x', {}).subscribe({ error: reject }),
    );
    backend.expectOne('/api/x').flush(null, { status: 503, statusText: 'Unavailable' });
    await expect(promise).rejects.toBeTruthy();
  });

  it('gives up after the capped attempt count', async () => {
    const promise = new Promise((_, reject) => http.get('/api/x').subscribe({ error: reject }));

    backend.expectOne('/api/x').flush(null, { status: 503, statusText: 'Unavailable' });
    await vi.advanceTimersByTimeAsync(300);
    backend.expectOne('/api/x').flush(null, { status: 503, statusText: 'Unavailable' });
    await vi.advanceTimersByTimeAsync(600);
    backend.expectOne('/api/x').flush(null, { status: 503, statusText: 'Unavailable' });

    await expect(promise).rejects.toBeTruthy();
  });

  it('honors Retry-After on a 429 before retrying, and succeeds after', async () => {
    const promise = new Promise((resolve) => http.get('/api/x').subscribe(resolve));

    backend.expectOne('/api/x').flush(null, {
      status: 429,
      statusText: 'Too Many Requests',
      headers: { 'Retry-After': '2' },
    });

    // Must not retry before the server-specified delay elapses.
    await vi.advanceTimersByTimeAsync(1000);
    backend.expectNone('/api/x');

    await vi.advanceTimersByTimeAsync(1500);
    backend.expectOne('/api/x').flush({ ok: true });

    await expect(promise).resolves.toEqual({ ok: true });
  });
});
