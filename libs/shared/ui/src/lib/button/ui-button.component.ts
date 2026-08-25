import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { DirectionalIconComponent } from '../directional-icon/directional-icon.component';

/**
 * Adds what a raw PrimeNG button does not: a translation-key label, a loading
 * state that also disables, and direction-aware icon placement. Not a
 * pass-through wrapper (spec section 9.4).
 */
@Component({
  selector: 'crm-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonModule, TranslocoPipe, DirectionalIconComponent],
  template: `
    <button
      pButton
      type="button"
      [severity]="variant()"
      [disabled]="disabled() || loading()"
      [attr.aria-busy]="loading()"
      (click)="clicked.emit()"
    >
      @if (icon(); as iconName) {
        <crm-directional-icon [name]="iconName" [mirrored]="iconMirrored()" />
      }
      <span>{{ labelKey() | transloco }}</span>
    </button>
  `,
})
export class UiButtonComponent {
  readonly labelKey = input.required<string>();
  readonly variant = input<'primary' | 'secondary' | 'danger'>('primary');
  readonly loading = input(false);
  readonly disabled = input(false);
  readonly icon = input<string | undefined>(undefined);
  readonly iconMirrored = input(true);

  readonly clicked = output<void>();
}
