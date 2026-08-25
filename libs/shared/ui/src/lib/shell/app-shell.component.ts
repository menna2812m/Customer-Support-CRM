import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { SessionStore } from '@crm/shared/auth';
import { NavigationService } from '@crm/shared/permissions';
import { LanguageSwitcherComponent } from './language-switcher.component';
import { ResponsiveGateComponent } from './responsive-gate.component';

/**
 * Layout only. It renders navigation from the permission-filtered manifest and
 * projects whatever the application puts in the header — the notification bell
 * included. The shell holds NO notification data of its own: that is a Phase 2
 * feature (spec sections 5.3, 12.1).
 *
 * Two header pieces the plan's Task 18 describes are absent, both deferred by
 * the 2026-08-25 scope amendment (spec section 12.2): the scope switcher, which
 * needs `ScopeContextService` and is blocked on open question B1, and the
 * connection indicator, which needs the realtime connection. Nothing else in
 * the shell depends on either, and `[shellHeaderEnd]` is where they will go.
 */
@Component({
  selector: 'crm-app-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    TranslocoPipe,
    LanguageSwitcherComponent,
    ResponsiveGateComponent,
  ],
  template: `
    <a class="crm-skip-link" href="#crm-main">{{
      'shell.skipToContent' | transloco
    }}</a>

    <div class="crm-shell">
      <header class="crm-shell__header">
        <div class="crm-shell__header-start"></div>

        <div class="crm-shell__header-end">
          <crm-language-switcher />
          <ng-content select="[shellHeaderEnd]" />
          <span class="crm-shell__user">{{
            session.identity()?.displayName
          }}</span>
        </div>
      </header>

      <nav
        class="crm-shell__nav"
        [attr.aria-label]="'shell.navigation' | transloco"
      >
        <ul>
          @for (item of navigation.visible(); track item.id) {
            <li>
              <a [routerLink]="item.route" routerLinkActive="is-active">
                {{ item.labelKey | transloco }}
              </a>

              @if (item.children?.length) {
                <ul>
                  @for (child of item.children; track child.id) {
                    <li>
                      <a
                        [routerLink]="child.route"
                        routerLinkActive="is-active"
                      >
                        {{ child.labelKey | transloco }}
                      </a>
                    </li>
                  }
                </ul>
              }
            </li>
          }
        </ul>
      </nav>

      <main id="crm-main" class="crm-shell__main" tabindex="-1">
        <crm-responsive-gate>
          <router-outlet />
        </crm-responsive-gate>
      </main>
    </div>
  `,
  styles: `
    .crm-shell {
      display: grid;
      grid-template-areas: 'header header' 'nav main';
      grid-template-columns: 16rem 1fr;
      grid-template-rows: auto 1fr;
      min-block-size: 100dvh;
    }

    .crm-shell__header {
      grid-area: header;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--crm-space-4);
      padding-inline: var(--crm-space-4);
      padding-block: var(--crm-space-3);
      border-block-end: 1px solid var(--crm-color-border);
    }

    .crm-shell__header-end {
      display: flex;
      align-items: center;
      gap: var(--crm-space-4);
    }

    .crm-shell__nav {
      grid-area: nav;
      padding: var(--crm-space-4);
      border-inline-end: 1px solid var(--crm-color-border);
    }

    .crm-shell__main {
      grid-area: main;
      padding: var(--crm-space-6);
    }

    /* Tablet: the sidebar collapses; operational routes stay usable (spec section 9.5). */
    @media (max-width: 63.99rem) {
      .crm-shell {
        grid-template-areas: 'header' 'main';
        grid-template-columns: 1fr;
      }

      .crm-shell__nav {
        display: none;
      }
    }

    .crm-skip-link {
      position: absolute;
      inset-block-start: -3rem;
      inset-inline-start: var(--crm-space-2);
      padding: var(--crm-space-2);
      background: var(--crm-color-surface);

      &:focus {
        inset-block-start: var(--crm-space-2);
      }
    }
  `,
})
export class AppShellComponent {
  protected readonly navigation = inject(NavigationService);
  protected readonly session = inject(SessionStore);
}
