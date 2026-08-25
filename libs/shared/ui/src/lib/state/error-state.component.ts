import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import type { AppError } from '@crm/shared/http';
import { UiButtonComponent } from '../button/ui-button.component';

/**
 * Page-load failure surface: the route is preserved and retry is offered.
 * The backend-authoritative traceId is shown in a copyable form, because without
 * it "it broke" reports are unsolvable (spec section 10.1).
 */
@Component({
  selector: 'crm-error-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoPipe, UiButtonComponent],
  template: `
    <div class="crm-error-state" role="alert">
      <p class="crm-error-state__message">
        {{ 'errors.' + error().code | transloco }}
      </p>

      <div class="crm-error-state__actions">
        <crm-button
          labelKey="errors.retry"
          data-testid="retry"
          (clicked)="retry.emit()"
        />
      </div>

      @if (error().traceId; as traceId) {
        <p class="crm-error-state__trace" data-testid="trace-id">
          <span>{{ 'errors.copyTraceId' | transloco }}:</span>
          <code>{{ traceId }}</code>
        </p>
      }
    </div>
  `,
  styles: `
    .crm-error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--crm-space-4);
      padding: var(--crm-space-8);
      text-align: center;
    }

    .crm-error-state__trace {
      color: var(--crm-color-text-muted);
      font-size: var(--crm-font-size-sm);
    }
  `,
})
export class ErrorStateComponent {
  readonly error = input.required<AppError>();
  readonly retry = output<void>();
}
