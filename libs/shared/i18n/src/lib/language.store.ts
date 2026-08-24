import { computed, Injectable, signal } from '@angular/core';
import { AppLanguage, DEFAULT_LANGUAGE, RTL_LANGUAGES } from './language';

/**
 * The single reactive source of the active language. Everything that depends on
 * language - formatting, direction, the Accept-Language header - reads this.
 *
 * `LOCALE_ID` resolves once at injection time and cannot follow a runtime
 * language switch (spec section 9.2), so this is a signal instead of a token.
 */
@Injectable({ providedIn: 'root' })
export class LanguageStore {
  private readonly active = signal<AppLanguage>(DEFAULT_LANGUAGE);

  readonly language = this.active.asReadonly();

  /** Derived data only (spec section 9.3): applying direction to the document
   * or the CDK is Task 7's `DirectionService`, not this store's job. */
  readonly direction = computed<'rtl' | 'ltr'>(() =>
    RTL_LANGUAGES.has(this.active()) ? 'rtl' : 'ltr',
  );

  setLanguage(language: AppLanguage): void {
    this.active.set(language);
  }
}
