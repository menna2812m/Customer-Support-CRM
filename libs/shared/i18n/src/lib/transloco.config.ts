import { HttpClient } from '@angular/common/http';
import {
  EnvironmentProviders,
  inject,
  Injectable,
  isDevMode,
  makeEnvironmentProviders,
} from '@angular/core';
import {
  provideTransloco,
  provideTranslocoMissingHandler,
  Translation,
  TranslocoLoader,
  TranslocoMissingHandler,
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
 * Missing keys throw in development so a missing string is caught immediately
 * rather than shipping. In production the raw key is returned as a safe,
 * visible placeholder instead of crashing the page (spec section 9.1).
 *
 * Transloco's built-in `missingHandler.useFallbackTranslation` is
 * deliberately left `false` (see `provideAppTranslation` below): that flag
 * resolves a miss against the fallback language *before* this handler ever
 * runs, so a key missing only in Arabic but present in English would render
 * silently instead of throwing here - exactly the loud-failure requirement
 * this handler exists to satisfy. Disabling it makes the handler the single,
 * deterministic place a missing key is decided, independent of which
 * language happens to have the string.
 */
@Injectable({ providedIn: 'root' })
export class ReportingMissingHandler implements TranslocoMissingHandler {
  handle(key: string): string {
    if (isDevMode()) {
      throw new Error(`Missing translation key: ${key}`);
    }
    return key;
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
  ]);
}
