import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEVICE_LANGUAGE_KEY, LanguageResolver } from './language-resolver.service';
import { LanguageStore } from './language.store';
import { provideAppTranslation } from './transloco.config';

describe('LanguageResolver', () => {
  let resolver: LanguageResolver;
  let store: LanguageStore;

  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['fr-FR']);
    // TranslocoService (which LanguageResolver depends on) needs the
    // application's translation wiring in scope; provideHttpClientTesting()
    // keeps the eager fallback-language load (see transloco.config.ts) from
    // reaching a real network backend in this unit test.
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideAppTranslation()],
    });
    resolver = TestBed.inject(LanguageResolver);
    store = TestBed.inject(LanguageStore);
  });

  it('falls back to English when nothing else applies', () => {
    expect(resolver.resolveUnauthenticated()).toBe('en');
  });

  it('prefers the browser language when it is supported', () => {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['ar-SA', 'en-US']);
    expect(resolver.resolveUnauthenticated()).toBe('ar');
  });

  it('prefers the stored device preference over the browser language', () => {
    localStorage.setItem(DEVICE_LANGUAGE_KEY, 'ar');
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['en-US']);
    expect(resolver.resolveUnauthenticated()).toBe('ar');
  });

  it('ignores an unsupported stored value', () => {
    localStorage.setItem(DEVICE_LANGUAGE_KEY, 'de');
    expect(resolver.resolveUnauthenticated()).toBe('en');
  });

  it('lets the server preference win once authenticated', () => {
    localStorage.setItem(DEVICE_LANGUAGE_KEY, 'en');
    resolver.applyServerPreference('ar');
    expect(store.language()).toBe('ar');
  });

  it('does NOT write the server preference to device storage', () => {
    resolver.applyServerPreference('ar');
    expect(localStorage.getItem(DEVICE_LANGUAGE_KEY)).toBeNull();
  });

  it('writes device storage only on an explicit user choice', () => {
    resolver.chooseExplicitly('ar');
    expect(localStorage.getItem(DEVICE_LANGUAGE_KEY)).toBe('ar');
    expect(store.language()).toBe('ar');
  });

  it('reverts to the device preference when the session ends', () => {
    resolver.chooseExplicitly('en');
    resolver.applyServerPreference('ar');
    expect(store.language()).toBe('ar');

    resolver.onSessionEnded();

    // The next user must not inherit the previous user's server preference.
    expect(store.language()).toBe('en');
  });

  it('reverts to the unauthenticated default when no device preference exists', () => {
    resolver.applyServerPreference('ar');
    resolver.onSessionEnded();
    expect(store.language()).toBe('en');
  });
});
