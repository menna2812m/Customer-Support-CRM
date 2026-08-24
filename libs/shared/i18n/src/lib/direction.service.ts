import { DOCUMENT } from '@angular/common';
import { effect, inject, Injectable, Injector, runInInjectionContext } from '@angular/core';
import { AppDirectionality } from './app-directionality';
import { LanguageStore } from './language.store';

/**
 * The single source of truth for direction (spec section 9.3). Derives direction
 * from the active language and synchronizes:
 *   - the document's lang and dir attributes,
 *   - Angular/CDK direction infrastructure,
 *   - PrimeNG and theme direction behavior, which key off the document dir
 *     attribute - a supported surface, not an internal detail.
 */
@Injectable({ providedIn: 'root' })
export class DirectionService {
  private readonly document = inject(DOCUMENT);
  private readonly languageStore = inject(LanguageStore);
  private readonly directionality = inject(AppDirectionality);
  private readonly injector = inject(Injector);
  private started = false;

  start(): void {
    if (this.started) {
      return;
    }
    this.started = true;

    runInInjectionContext(this.injector, () => {
      effect(() => {
        const language = this.languageStore.language();
        const direction = this.languageStore.direction();

        const root = this.document.documentElement;
        root.setAttribute('lang', language);
        root.setAttribute('dir', direction);

        this.directionality.update(direction);
      });
    });
  }
}
