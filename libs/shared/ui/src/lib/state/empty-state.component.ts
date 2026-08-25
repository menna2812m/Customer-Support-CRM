import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'crm-empty-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoPipe],
  template: `
    <div class="crm-empty-state">
      <p class="crm-empty-state__title">{{ titleKey() | transloco }}</p>
      @if (descriptionKey(); as description) {
        <p class="crm-empty-state__description">
          {{ description | transloco }}
        </p>
      }
      <ng-content />
    </div>
  `,
  styles: `
    .crm-empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--crm-space-2);
      padding: var(--crm-space-8);
      color: var(--crm-color-text-muted);
      text-align: center;
    }
  `,
})
export class EmptyStateComponent {
  readonly titleKey = input.required<string>();
  readonly descriptionKey = input<string | undefined>(undefined);
}
