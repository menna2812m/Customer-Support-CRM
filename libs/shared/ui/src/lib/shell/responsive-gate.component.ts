import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { ViewportService } from './viewport.service';

/**
 * Responsive behavior is ROUTE-SPECIFIC, not application-wide (spec section 9.5):
 *   portal      -> mobile-first, never blocked
 *   operational -> desktop-first, tablet usable, PHONE UNSUPPORTED
 *   dashboard   -> responsive on phones, never blocked
 *
 * Declared per route as `data: { responsive: 'operational' }`.
 */
export type ResponsivePolicy = 'portal' | 'operational' | 'dashboard';

@Component({
  selector: 'crm-responsive-gate',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoPipe],
  template: `
    @if (blocked()) {
      <div
        class="crm-small-screen"
        data-testid="small-screen-notice"
        role="status"
      >
        <p>{{ 'shell.openOnLargerScreen' | transloco }}</p>
      </div>
    } @else {
      <ng-content />
    }
  `,
  styles: `
    .crm-small-screen {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--crm-space-8);
      text-align: center;
      color: var(--crm-color-text-muted);
    }
  `,
})
export class ResponsiveGateComponent {
  private readonly viewport = inject(ViewportService);
  private readonly data = toSignal(inject(ActivatedRoute).data, {
    initialValue: {},
  });

  protected readonly blocked = computed(() => {
    const policy = (this.data() as { responsive?: ResponsivePolicy })
      .responsive;
    return policy === 'operational' && this.viewport.isPhone();
  });
}
