import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageResolver, provideAppTranslation } from '@crm/shared/i18n';
import { mswServer, PROVISIONAL_IDENTITY } from '@crm/shared/testing';
import { DevSessionStrategy } from './dev-session.strategy';
import { SessionStore } from './session.store';

describe('DevSessionStrategy', () => {
  let strategy: DevSessionStrategy;
  let store: SessionStore;
  let language: LanguageResolver;

  beforeEach(() => {
    // LanguageResolver (which the strategy applies the server preference
    // through) depends on TranslocoService, which needs the full translation
    // wiring in scope. provideAppTranslation() eagerly loads the fallback
    // language (see transloco.config.ts) — stub that request rather than
    // letting it fall through as an unhandled MSW request.
    mswServer.use(http.get('*/i18n/en.json', () => HttpResponse.json({})));
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideAppTranslation(), DevSessionStrategy],
    });
    strategy = TestBed.inject(DevSessionStrategy);
    store = TestBed.inject(SessionStore);
    language = TestBed.inject(LanguageResolver);
  });

  it('starts in an unknown state before initialization', () => {
    expect(store.status()).toBe('unknown');
    expect(store.identity()).toBeNull();
  });

  it('loads identity from GET /me during initialization', async () => {
    await strategy.initialize();
    expect(store.status()).toBe('authenticated');
    expect(store.identity()?.userId).toBe(PROVISIONAL_IDENTITY.userId);
  });

  it('leaves the request untouched: no transport is assumed', async () => {
    await strategy.initialize();
    const request = { headers: {} } as never;
    expect(strategy.authorize(request)).toBe(request);
  });

  it('clears identity on logout', async () => {
    await strategy.initialize();
    await strategy.logout();
    expect(store.status()).toBe('anonymous');
    expect(store.identity()).toBeNull();
  });

  it('drops the server language preference on logout so it cannot leak into the next session', async () => {
    const onSessionEnded = vi.spyOn(language, 'onSessionEnded');
    await strategy.initialize();
    await strategy.logout();
    expect(onSessionEnded).toHaveBeenCalledTimes(1);
  });

  it('applies the server preference from the loaded identity during initialization', async () => {
    const applyServerPreference = vi.spyOn(language, 'applyServerPreference');
    await strategy.initialize();
    expect(applyServerPreference).toHaveBeenCalledWith(PROVISIONAL_IDENTITY.language);
  });
});
