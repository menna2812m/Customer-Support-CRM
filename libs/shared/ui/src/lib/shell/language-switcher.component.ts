import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import {
  AppLanguage,
  LanguageResolver,
  LanguageStore,
  SUPPORTED_LANGUAGES,
} from '@crm/shared/i18n';

@Component({
  selector: 'crm-language-switcher',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoPipe],
  template: `
    <label class="crm-visually-hidden" for="crm-language">{{
      'shell.language' | transloco
    }}</label>
    <select
      id="crm-language"
      [value]="store.language()"
      (change)="choose($any($event.target).value)"
    >
      @for (language of languages; track language) {
        <option [value]="language">
          {{ 'shell.languageName.' + language | transloco }}
        </option>
      }
    </select>
  `,
  styles: `
    .crm-visually-hidden {
      position: absolute;
      inline-size: 1px;
      block-size: 1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }
  `,
})
export class LanguageSwitcherComponent {
  protected readonly store = inject(LanguageStore);
  private readonly resolver = inject(LanguageResolver);
  protected readonly languages = SUPPORTED_LANGUAGES;

  /** An explicit user choice: updates the device preference AND the active language. */
  choose(language: AppLanguage): void {
    this.resolver.chooseExplicitly(language);
  }
}
