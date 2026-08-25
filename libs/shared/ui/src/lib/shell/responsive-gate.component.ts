import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { filter, map, startWith } from 'rxjs';
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

/**
 * The gate sits OUTSIDE the router outlet, in the shell, so its own
 * `ActivatedRoute` is the root — which carries none of the matched route's
 * data. The policy has to come from the deepest activated route instead, which
 * also means recomputing it on every navigation.
 */
function deepestRoute(route: ActivatedRoute): ActivatedRoute {
  let current = route;
  while (current.firstChild) {
    current = current.firstChild;
  }
  return current;
}

@Component({
  selector: 'crm-responsive-gate',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoPipe],
  template: `
    @if (blocked()) {
      <div class="crm-small-screen" data-testid="small-screen-notice" role="status">
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
  private readonly router = inject(Router);

  private readonly policy = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      startWith(null),
      map(
        () =>
          deepestRoute(this.router.routerState.root).snapshot.data['responsive'] as
            | ResponsivePolicy
            | undefined,
      ),
    ),
    { initialValue: undefined },
  );

  protected readonly blocked = computed(
    () => this.policy() === 'operational' && this.viewport.isPhone(),
  );
}
