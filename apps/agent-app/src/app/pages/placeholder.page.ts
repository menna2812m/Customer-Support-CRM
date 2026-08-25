import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { EmptyStateComponent } from '@crm/shared/ui';

/** Stand-in until the owning phase builds the feature. Carries no domain logic. */
@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EmptyStateComponent],
  template: `<crm-empty-state titleKey="state.empty" />`,
})
export class PlaceholderPage {
  readonly title = input('');
}
