import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AppShellComponent } from '@crm/shared/ui';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppShellComponent],
  template: `<crm-app-shell />`,
})
export class AppComponent {}
