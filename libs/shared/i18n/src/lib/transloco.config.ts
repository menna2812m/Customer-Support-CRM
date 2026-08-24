import { HttpClient } from '@angular/common/http';
import {
  EnvironmentProviders,
  inject,
  Injectable,
  InjectionToken,
  Injector,
  isDevMode,
  makeEnvironmentProviders,
  provideEnvironmentInitializer,
} from '@angular/core';
import {
  provideTransloco,
  provideTranslocoMissingHandler,
  Translation,
  TranslocoLoader,
  TranslocoMissingHandler,
  TranslocoMissingHandlerData,
  TranslocoService,
} from '@jsverse/transloco';
import { provideTranslocoMessageformat } from '@jsverse/transloco-messageformat';
import { Observable } from 'rxjs';
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from './language';

/**
 * Scopes are aligned one-to-one with feature libraries, so a feature's strings
 * load with its route chunk (spec section 9.1). A scoped file lives at
 * /i18n/<scope>/<lang>.json; a root file at /i18n/<lang>.json.
 */
@Injectable({ providedIn: 'root' })
export class HttpTranslationLoader implements TranslocoLoader {
  private readonly http = inject(HttpClient);

  getTranslation(path: string): Observable<Translation> {
    return this.http.get<Translation>(`/i18n/${path}.json`);
  }
}

/**
 * DI seam over Angular's global `isDevMode()` so tests can drive
 * `ReportingMissingHandler`'s production branch without calling the
 * process-global `enableProdMode()` (which would leak into every other
 * test in the run - see task-5-report.md, Fix round 1). Defaults to the
 * real `isDevMode()`; tests override this token directly instead.
 */
export const IS_DEV_MODE = new InjectionToken<boolean>('IS_DEV_MODE', {
  factory: () => isDevMode(),
});

/**
 * Missing keys throw in development so a missing string is caught
 * immediately rather than shipping. In production, a miss:
 *
 *  1. is reported (currently via `console.warn`, with the key and the
 *     active language) so it stays discoverable instead of shipping to
 *     Arabic users unnoticed. TODO(Task 13 - shared/observability): once
 *     the observability abstraction exists, route this through it
 *     instead of `console.warn`.
 *  2. resolves to the fallback language's (English's) value for that key
 *     when one exists,
 *  3. and otherwise returns the bare key as the last-resort placeholder.
 *
 * This is deliberately NOT implemented via Transloco's own
 * `missingHandler.useFallbackTranslation` flag (see `provideAppTranslation`
 * below, kept `false`): that flag resolves a miss against the fallback
 * language *before* this handler ever runs, so a miss would be silently
 * swallowed - never reported, and never thrown in development either
 * (confirmed experimentally - see task-5-report.md, Fix round 1).
 */
@Injectable({ providedIn: 'root' })
export class ReportingMissingHandler implements TranslocoMissingHandler {
  private readonly devMode = inject(IS_DEV_MODE);

  // Resolved lazily via Injector.get() inside handle(), never injected
  // directly as a constructor/field dependency: TranslocoService's own
  // constructor depends on this class through TRANSLOCO_MISSING_HANDLER,
  // so injecting TranslocoService eagerly here is a circular dependency
  // - confirmed experimentally (NG0200) before settling on this approach;
  // see task-5-report.md, Fix round 1.
  private readonly injector = inject(Injector);

  handle(key: string, data: TranslocoMissingHandlerData, params?: Record<string, unknown>): string {
    if (this.devMode) {
      throw new Error(`Missing translation key: ${key}`);
    }

    // TODO(Task 13 - shared/observability): route this through the
    // observability abstraction once it exists; console.warn is the
    // stand-in until then.
    console.warn(`[i18n] Missing translation key "${key}" for language "${data.activeLang}".`);

    const transloco = this.injector.get(TranslocoService);
    const fallbackTranslations = transloco.getTranslation(DEFAULT_LANGUAGE);
    const hasFallback = Object.prototype.hasOwnProperty.call(fallbackTranslations, key);

    return hasFallback ? transloco.translate(key, params, DEFAULT_LANGUAGE) : key;
  }
}

export function provideAppTranslation(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideTransloco({
      config: {
        availableLangs: [...SUPPORTED_LANGUAGES],
        defaultLang: DEFAULT_LANGUAGE,
        fallbackLang: DEFAULT_LANGUAGE,
        reRenderOnLangChange: true,
        // See ReportingMissingHandler above: kept false so a missing key
        // always reaches the handler instead of being silently resolved
        // against the fallback language first.
        missingHandler: { allowEmpty: false, useFallbackTranslation: false },
        prodMode: !isDevMode(),
      },
      loader: HttpTranslationLoader,
    }),
    provideTranslocoMessageformat(),
    provideTranslocoMissingHandler(ReportingMissingHandler),
    /**
     * ReportingMissingHandler's fallback branch resolves a miss against
     * `transloco.getTranslation(DEFAULT_LANGUAGE)` (English) - but that only
     * has anything in it if English's translation document has actually been
     * fetched into TranslocoService's cache. Under this app's load-only-the-
     * active-language strategy, if Arabic is active, `en.json` would
     * otherwise never be requested, and "missing in Arabic, present in
     * English" would degrade to "missing in both" (a raw key in the UI).
     *
     * `fallbackLang` above only tells the *default* missing-key resolution
     * where to look; it does not, by itself, cause English to be fetched
     * when a different language is active (confirmed experimentally - see
     * transloco.config.spec.ts, "eager fallback language loading": without
     * this initializer, the /i18n/en.json request never fires when Arabic is
     * the active language). So request it explicitly, unconditionally, at
     * startup, regardless of which language ends up active.
     *
     * `provideEnvironmentInitializer` (not `provideAppInitializer`) is used
     * deliberately: it runs synchronously as soon as the environment
     * injector is created - including under TestBed - rather than only when
     * an application is actually bootstrapped, so this load is exercised the
     * same way in tests as in a running app.
     */
    provideEnvironmentInitializer(() => {
      inject(TranslocoService).load(DEFAULT_LANGUAGE).subscribe();
    }),
  ]);
}
