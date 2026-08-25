import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SESSION_STRATEGY, SessionStore } from '@crm/shared/auth';
import { ErrorStateComponent, UiButtonComponent } from '@crm/shared/ui';

/**
 * Minimal by design. How credentials are acquired is open question U1 and
 * belongs entirely to the active `SessionStrategy`; this page knows only that
 * something called `login()` and where to go afterwards.
 *
 * `returnTo` is read from the query string, where `authenticatedGuard` put it,
 * and is only ever used as a relative path — an absolute or scheme-carrying
 * value would turn the login page into an open redirect.
 */
@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiButtonComponent, ErrorStateComponent],
  template: `
    <main class="crm-login">
      <crm-button
        labelKey="auth.signIn"
        [loading]="pending()"
        (clicked)="signIn()"
      />

      @if (failed()) {
        <crm-error-state
          [error]="{ code: 'auth.sign_in_failed', retriable: true }"
          (retry)="signIn()"
        />
      }
    </main>
  `,
  styles: `
    .crm-login {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--crm-space-4);
      padding: var(--crm-space-8);
    }
  `,
})
export class LoginPage {
  private readonly strategy = inject(SESSION_STRATEGY);
  private readonly session = inject(SessionStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly pending = signal(false);
  protected readonly failed = signal(false);

  protected async signIn(): Promise<void> {
    this.pending.set(true);
    this.failed.set(false);
    try {
      await this.strategy.login();
    } finally {
      this.pending.set(false);
    }

    if (this.session.status() !== 'authenticated') {
      this.failed.set(true);
      return;
    }

    await this.router.navigateByUrl(this.safeReturnTo());
  }

  /** Only a same-origin, path-relative destination is ever honoured. */
  private safeReturnTo(): string {
    const requested = this.route.snapshot.queryParamMap.get('returnTo');
    return requested?.startsWith('/') && !requested.startsWith('//')
      ? requested
      : '/';
  }
}
