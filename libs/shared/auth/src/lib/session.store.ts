import { computed, Injectable, signal } from '@angular/core';
import { Identity } from './session-strategy';

export type SessionStatus = 'unknown' | 'authenticated' | 'anonymous';

/**
 * Holds the resolved principal in memory only. Nothing here persists to
 * localStorage, sessionStorage, cookies, or IndexedDB — the backend remains
 * authoritative for authorization, and this store exists purely to make the
 * already-resolved state observable to the UI.
 */
@Injectable({ providedIn: 'root' })
export class SessionStore {
  private readonly current = signal<Identity | null>(null);
  private readonly resolved = signal(false);

  readonly identity = this.current.asReadonly();
  readonly status = computed<SessionStatus>(() => {
    if (!this.resolved()) {
      return 'unknown';
    }
    return this.current() ? 'authenticated' : 'anonymous';
  });

  setIdentity(identity: Identity): void {
    this.current.set(identity);
    this.resolved.set(true);
  }

  setAnonymous(): void {
    this.current.set(null);
    this.resolved.set(true);
  }
}
