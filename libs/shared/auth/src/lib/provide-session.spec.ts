import { HttpRequest, provideHttpClient } from '@angular/common/http';
import { ApplicationInitStatus, Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { http, HttpResponse } from 'msw';
import { Observable, of } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { provideAppTranslation } from '@crm/shared/i18n';
import { SESSION_CREDENTIAL_PROVIDER } from '@crm/shared/http';
import { mswServer, PROVISIONAL_IDENTITY } from '@crm/shared/testing';
import { DevSessionStrategy } from './dev-session.strategy';
import { provideSession } from './provide-session';
import { SessionStrategy } from './session-strategy';
import { SessionStore } from './session.store';

const stubTranslationRequests = () =>
  mswServer.use(http.get('*/i18n/en.json', () => HttpResponse.json({})));

describe('provideSession', () => {
  beforeEach(() => stubTranslationRequests());

  it('loads identity before application bootstrap completes', async () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideAppTranslation(), provideSession(DevSessionStrategy)],
    });

    await TestBed.inject(ApplicationInitStatus).donePromise;

    const store = TestBed.inject(SessionStore);
    expect(store.status()).toBe('authenticated');
    expect(store.identity()?.userId).toBe(PROVISIONAL_IDENTITY.userId);
  });

  it('wires SESSION_CREDENTIAL_PROVIDER to delegate to the active strategy', async () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideAppTranslation(), provideSession(DevSessionStrategy)],
    });
    await TestBed.inject(ApplicationInitStatus).donePromise;

    const provider = TestBed.inject(SESSION_CREDENTIAL_PROVIDER);
    const request = { headers: {} } as unknown as HttpRequest<unknown>;

    // DevSessionStrategy.authorize is a no-op: the credential provider must
    // reflect that, proving delegation rather than a hard-coded default.
    expect(provider.authorize(request)).toBe(request);
    await expect(new Promise((resolve) => provider.reauthenticate().subscribe(resolve))).resolves.toBe(
      false,
    );
  });

  /**
   * A fake strategy standing in for a future production strategy (OIDC, JWT,
   * a session cookie — whatever authentication ultimately becomes). It
   * attaches a made-up credential shape that no other file in this test, nor
   * `provideSession` itself, has any awareness of. If swapping strategies
   * required a change anywhere outside the argument passed to
   * `provideSession`, this fake would need to touch something else too — it
   * does not.
   */
  @Injectable()
  class FakeProductionStrategy implements SessionStrategy {
    async initialize(): Promise<void> {
      /* no-op: this fake never resolves an identity */
    }
    async login(): Promise<void> {
      /* no-op */
    }
    async logout(): Promise<void> {
      /* no-op */
    }
    authorize(req: HttpRequest<unknown>): HttpRequest<unknown> {
      return req.clone({ setHeaders: { 'x-fake-credential': 'stand-in' } });
    }
    reauthenticate(): Observable<boolean> {
      return of(true);
    }
  }

  it('swapping the strategy changes credential behavior with no other code changed', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideAppTranslation(),
        provideSession(FakeProductionStrategy),
      ],
    });
    await TestBed.inject(ApplicationInitStatus).donePromise;

    const provider = TestBed.inject(SESSION_CREDENTIAL_PROVIDER);
    const request = new HttpRequest<unknown>('GET', '/api/x');
    const authorized = provider.authorize(request);

    expect(authorized.headers.get('x-fake-credential')).toBe('stand-in');
    await expect(new Promise((resolve) => provider.reauthenticate().subscribe(resolve))).resolves.toBe(
      true,
    );
  });
});
