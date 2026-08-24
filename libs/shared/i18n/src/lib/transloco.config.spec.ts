import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_LANGUAGE, isAppLanguage, provideAppTranslation, SUPPORTED_LANGUAGES } from '../index';
import { HttpTranslationLoader } from './transloco.config';

describe('application translation', () => {
  let transloco: TranslocoService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideAppTranslation()] });
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
