import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, ValidationErrors } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import { map, startWith, switchMap } from 'rxjs';
import { ValidationMessagePipe } from './validation-message.pipe';

let nextId = 0;

interface ControlState {
  readonly invalid: boolean;
  readonly touched: boolean;
  readonly dirty: boolean;
  readonly errors: ValidationErrors | null;
}

/**
 * Label, projected control, and translated validation message in one consistent
 * unit, wired for assistive technology. Field validation is shown inline and
 * carries no traceId — that is reserved for actionable failures
 * (spec section 10.1).
 */
@Component({
  selector: 'crm-form-field',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoPipe, ValidationMessagePipe],
  template: `
    <div class="crm-field">
      <label [attr.for]="controlId">{{ labelKey() | transloco }}</label>
      <ng-content />

      @if (hintKey(); as hint) {
        <p class="crm-field__hint">{{ hint | transloco }}</p>
      }

      @if (showError()) {
        <p
          class="crm-field__error"
          role="alert"
          [id]="errorId"
          data-testid="field-error"
        >
          {{ (errors() | validationMessage) ?? 'errors.generic' | transloco }}
        </p>
      }
    </div>
  `,
  styles: `
    .crm-field {
      display: flex;
      flex-direction: column;
      gap: var(--crm-space-1);
      margin-block-end: var(--crm-space-4);
    }

    .crm-field__hint {
      margin: 0;
      color: var(--crm-color-text-muted);
      font-size: var(--crm-font-size-sm);
    }

    .crm-field__error {
      margin: 0;
      color: var(--crm-color-danger);
      font-size: var(--crm-font-size-sm);
    }
  `,
})
export class FormFieldComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly labelKey = input.required<string>();
  readonly control = input.required<AbstractControl>();
  readonly hintKey = input<string | undefined>(undefined);

  protected readonly controlId = `crm-field-${nextId++}`;
  protected readonly errorId = `${this.controlId}-error`;

  /**
   * `AbstractControl` is not reactive: validity, touched, and dirty are plain
   * properties, so a `computed` over `control()` alone would be memoised on
   * first read and never see the control being touched. `control.events` is
   * the control's own change channel, so it is what this reads.
   */
  private readonly state = toSignal(
    toObservable(this.control).pipe(
      switchMap((control) =>
        control.events.pipe(
          startWith(null),
          map(
            (): ControlState => ({
              invalid: control.invalid,
              touched: control.touched,
              dirty: control.dirty,
              errors: control.errors,
            }),
          ),
        ),
      ),
    ),
    { initialValue: null },
  );

  protected readonly showError = computed(() => {
    const state = this.state();
    return state !== null && state.invalid && (state.touched || state.dirty);
  });

  protected readonly errors = computed(() => this.state()?.errors ?? null);

  constructor() {
    // Bind the projected control to its label and message without requiring
    // every consumer to repeat the wiring.
    effect(() => {
      const element = this.host.nativeElement.querySelector(
        'input, select, textarea',
      );
      if (!element) {
        return;
      }
      element.id ||= this.controlId;
      element.setAttribute('aria-invalid', String(this.showError()));
      if (this.showError()) {
        element.setAttribute('aria-describedby', this.errorId);
      } else {
        element.removeAttribute('aria-describedby');
      }
    });
  }
}
