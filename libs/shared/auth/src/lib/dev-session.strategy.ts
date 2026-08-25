import { HttpClient, HttpRequest } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom, Observable, of } from 'rxjs';
import { LanguageResolver } from '@crm/shared/i18n';
import { Identity, SessionStrategy } from './session-strategy';
import { SessionStore } from './session.store';

/**
 * Development implementation of `SessionStrategy`. Reads identity from
 * `GET /api/me` and holds it in `SessionStore` (memory only — never
 * localStorage, sessionStorage, cookies, or IndexedDB, so a shared support
 * terminal cannot leak one agent's identity to the next).
 *
 * `authorize()` attaches nothing and `reauthenticate()` never succeeds: the
 * real credential transport is open question U1 and arrives with whichever
 * production strategy replaces this one. Nothing outside a `SessionStrategy`
 * implementation may assume a transport.
 */
@Injectable()
export class DevSessionStrategy implements SessionStrategy {
  private readonly http = inject(HttpClient);
  private readonly store = inject(SessionStore);
  private readonly language = inject(LanguageResolver);

  async initialize(): Promise<void> {
    try {
      const identity = await firstValueFrom(this.http.get<Identity>('/api/me'));
      this.store.setIdentity(identity);
      // The server preference wins once authenticated (spec section 9.3).
      this.language.applyServerPreference(identity.language);
    } catch {
      this.store.setAnonymous();
    }
  }

  async login(): Promise<void> {
    await this.initialize();
  }

  async logout(): Promise<void> {
    this.store.setAnonymous();
    // Drop the server preference so it cannot leak into the next session on a
    // shared device (spec section 9.3).
    this.language.onSessionEnded();
  }

  authorize(req: HttpRequest<unknown>): HttpRequest<unknown> {
    return req;
  }

  reauthenticate(): Observable<boolean> {
    return of(false);
  }
}
