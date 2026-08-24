import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_LANGUAGE, isAppLanguage, provideAppTranslation, SUPPORTED_LANGUAGES } from '../index';
import { HttpTranslationLoader, IS_DEV_MODE } from './transloco.config';

describe('application translation', () => {
  let transloco: TranslocoService;

  beforeEach(() => {
    // provideHttpClientTesting() keeps the eager fallback-language load (see
    // "eager fallback language loading" below) from reaching a real network
    // backend here; these tests never flush it, which is fine - nothing here
    // asserts against it.
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideAppTranslation()],
    });
    transloco = TestBed.inject(TranslocoService);
  });

  it('supports exactly Arabic and English', () => {
    expect([...SUPPORTED_LANGUAGES].sort()).toEqual(['ar', 'en']);
    expect(DEFAULT_LANGUAGE).toBe('en');
  });

  it('recognizes supported languages and rejects others', () => {
    expect(isAppLanguage('ar')).toBe(true);
    expect(isAppLanguage('fr')).toBe(false);
    expect(isAppLanguage(undefined)).toBe(false);
  });

  it('resolves the six Arabic plural categories through ICU', () => {
    const message =
      '{count, plural, zero{لا تذاكر} one{تذكرة واحدة} two{تذكرتان} few{# تذاكر} many{# تذكرة} other{# تذكرة}}';
    transloco.setTranslation({ 'tickets.count': message }, 'ar');
    transloco.setActiveLang('ar');

    const render = (count: number) => transloco.translate('tickets.count', { count });

    expect(render(0)).toBe('لا تذاكر');
    expect(render(1)).toBe('تذكرة واحدة');
    expect(render(2)).toBe('تذكرتان');
    expect(render(3)).toBe('3 تذاكر');
    expect(render(11)).toBe('11 تذكرة');
  });

  it('reports a missing key rather than rendering it silently', () => {
    transloco.setActiveLang('en');
    expect(() => transloco.translate('nope.missing.key')).toThrowError(/nope\.missing\.key/);
  });

  it('throws even when the key exists only in the fallback language (not swallowed by fallback resolution)', () => {
    transloco.setTranslation({ 'only.in.english': 'hello' }, 'en');
    transloco.setActiveLang('ar');
    expect(() => transloco.translate('only.in.english')).toThrowError(/only\.in\.english/);
  });
});

describe('ReportingMissingHandler in production', () => {
  let transloco: TranslocoService;
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAppTranslation(),
        { provide: IS_DEV_MODE, useValue: false },
      ],
    });
    transloco = TestBed.inject(TranslocoService);
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('falls back to the English translation when Arabic is missing the key', () => {
    transloco.setTranslation({ 'shell.language': 'Language' }, 'en');
    transloco.setActiveLang('ar');

    expect(transloco.translate('shell.language')).toBe('Language');
  });

  it('returns the bare key when neither language has it', () => {
    transloco.setActiveLang('ar');

    expect(transloco.translate('nope.missing.key')).toBe('nope.missing.key');
  });

  it('reports the miss with the key and the active language', () => {
    transloco.setActiveLang('ar');

    transloco.translate('nope.missing.key');

    expect(warnSpy).toHaveBeenCalledTimes(1);
    const [message] = warnSpy.mock.calls[0];
    expect(message).toContain('nope.missing.key');
    expect(message).toContain('ar');
  });
});

describe('eager fallback language loading', () => {
  let transloco: TranslocoService;
  let httpMock: HttpTestingController;
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAppTranslation(),
        { provide: IS_DEV_MODE, useValue: false },
      ],
    });
    transloco = TestBed.inject(TranslocoService);
    httpMock = TestBed.inject(HttpTestingController);
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    warnSpy.mockRestore();
    httpMock.verify();
  });

  it('resolves a key missing from the active (Arabic) language through the eagerly loaded English cache - without the test priming English manually', () => {
    transloco.setActiveLang('ar');

    // provideAppTranslation() must have fired this request already, at
    // startup, independent of which language is active. Flushing it is the
    // ONLY way English enters TranslocoService's cache in this test - there
    // is no transloco.setTranslation(..., 'en') call anywhere above.
    httpMock.expectOne('/i18n/en.json').flush({ 'shell.language': 'Language' });

    expect(transloco.translate('shell.language')).toBe('Language');
  });
});

describe('HttpTranslationLoader', () => {
  let loader: HttpTranslationLoader;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    loader = TestBed.inject(HttpTranslationLoader);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('resolves a root path to /i18n/<lang>.json', () => {
    loader.getTranslation('en').subscribe();
    httpMock.expectOne('/i18n/en.json').flush({});
  });

  it('resolves a scoped path to /i18n/<scope>/<lang>.json', () => {
    loader.getTranslation('tickets/en').subscribe();
    httpMock.expectOne('/i18n/tickets/en.json').flush({});
  });
});
