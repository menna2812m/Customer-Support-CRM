import { BreakpointObserver } from '@angular/cdk/layout';
import { computed, inject, Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

/** Shared breakpoint tokens. Both applications read the same values. */
export const BREAKPOINTS = {
  phone: '(max-width: 47.99rem)',
  tablet: '(min-width: 48rem) and (max-width: 63.99rem)',
  desktop: '(min-width: 64rem)',
} as const;

@Injectable({ providedIn: 'root' })
export class ViewportService {
  private readonly observer = inject(BreakpointObserver);

  private readonly state = toSignal(
    this.observer.observe([
      BREAKPOINTS.phone,
      BREAKPOINTS.tablet,
      BREAKPOINTS.desktop,
    ]),
    {
      initialValue: {
        matches: false,
        breakpoints: {} as Record<string, boolean>,
      },
    },
  );

  readonly isPhone = computed(
    () => this.state().breakpoints[BREAKPOINTS.phone] === true,
  );
  readonly isTablet = computed(
    () => this.state().breakpoints[BREAKPOINTS.tablet] === true,
  );
  readonly isDesktop = computed(
    () => this.state().breakpoints[BREAKPOINTS.desktop] === true,
  );
}
