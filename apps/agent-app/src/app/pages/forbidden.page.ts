import { ChangeDetectionStrategy, Component } from '@angular/core';
import { EmptyStateComponent } from '@crm/shared/ui';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EmptyStateComponent],
  template: `<crm-empty-state titleKey="errors.forbidden" />`,
})
export class ForbiddenPage {}
