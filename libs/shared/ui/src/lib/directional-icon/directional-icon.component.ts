import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { LanguageStore } from '@crm/shared/i18n';

/**
 * Arrows, chevrons, back/forward, and next/previous mirror automatically.
 * Ad-hoc directional icons are where RTL consistently leaks (spec section 9.3).
 */
@Component({
  selector: 'crm-directional-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span [class]="classes()" [attr.aria-hidden]="true"></span>`,
  styles: `
    .crm-icon--mirrored {
      transform: scaleX(-1);
    }
  `,
})
export class DirectionalIconComponent {
  private readonly languageStore = inject(LanguageStore);

  readonly name = input.required<string>();
  /** Set false for icons whose meaning does not depend on reading direction. */
  readonly mirrored = input(true);

  protected readonly classes = computed(() => {
    const base = `crm-icon crm-icon--${this.name()}`;
    const shouldMirror =
      this.mirrored() && this.languageStore.direction() === 'rtl';
    return shouldMirror ? `${base} crm-icon--mirrored` : base;
  });
}
