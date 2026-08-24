import { inject, Injectable } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { AppLanguage, DEFAULT_LANGUAGE, isAppLanguage } from './language';
import { LanguageStore } from './language.store';

/**
 * A BROWSER/DEVICE preference, not an identity attribute. It is written only by
 * an explicit user choice, never from a server preference — otherwise one
 * authenticated user's preference would leak into the next user's session on a
 * shared device (spec section 9.3).
 */
export const DEVICE_LANGUAGE_KEY = 'crm.device.language';

@Injectable({ providedIn: 'root' })
export class LanguageResolver {
  private readonly store = inject(LanguageStore);
  private readonly transloco = inject(TranslocoService);

  /** Resolution order before authentication: device storage, browser, English. */
  resolveUnauthenticated(): AppLanguage {
    const stored = this.readDevicePreference();
    if (stored) {
      return stored;
    }

    for (const tag of navigator.languages ?? []) {
      const base = tag.split('-')[0];
      if (isAppLanguage(base)) {
        return base;
      }
    }

    return DEFAULT_LANGUAGE;
  }

  /** Applied in memory only: the server preference never touches device storage. */
  applyServerPreference(language: AppLanguage): void {
    this.activate(language);
  }

  /** An explicit switch updates the device preference and the active language. */
  chooseExplicitly(language: AppLanguage): void {
    localStorage.setItem(DEVICE_LANGUAGE_KEY, language);
    this.activate(language);
  }

  /**
   * On logout or user switch, drop the server preference and fall back to the
   * device preference, so the next user does not inherit the previous user's.
   *
   * Same behavior as `applyUnauthenticatedDefault` below - both delegate to
   * this one implementation - but kept as two names because they express
   * different intent at the call site: this one for "a session just ended",
   * that one for "there was never a session to begin with".
   */
  onSessionEnded(): void {
    this.activate(this.resolveUnauthenticated());
  }

  /** Applies the pre-authentication default. Does not write device storage. */
  applyUnauthenticatedDefault(): void {
    this.onSessionEnded();
  }

  private activate(language: AppLanguage): void {
    this.store.setLanguage(language);
    this.transloco.setActiveLang(language);
  }

  private readDevicePreference(): AppLanguage | null {
    const stored = localStorage.getItem(DEVICE_LANGUAGE_KEY);
    return isAppLanguage(stored) ? stored : null;
  }
}
