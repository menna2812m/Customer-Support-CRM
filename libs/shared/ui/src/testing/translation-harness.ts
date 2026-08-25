import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { Provider, EnvironmentProviders } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Translation, TranslocoService } from '@jsverse/transloco';
import { provideAppTranslation } from '@crm/shared/i18n';

/**
 * Component tests use the real translation configuration rather than a stub, so
 * they exercise the actual loader, missing-key handler, and eager fallback
 * load. That configuration fetches `/i18n/<lang>.json` at startup, and the
 * Transloco pipe emits nothing until that request settles — so a test must
 * answer it rather than ignore it.
 */
export const translationProviders: (Provider | EnvironmentProviders)[] = [
  provideHttpClient(),
  provideHttpClientTesting(),
  provideAppTranslation(),
];

/**
 * Answers the startup translation request with `translation` and activates
 * `lang`. Call once, after `TestBed.configureTestingModule`, before rendering.
 */
export function flushTranslation(translation: Translation, lang = 'en'): void {
  const http = TestBed.inject(HttpTestingController);
  http.expectOne(`/i18n/${lang}.json`).flush(translation);
  TestBed.inject(TranslocoService).setActiveLang(lang);
}
