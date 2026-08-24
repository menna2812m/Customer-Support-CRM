import { HttpContext, HttpContextToken, HttpRequest } from '@angular/common/http';
import { InjectionToken } from '@angular/core';
import { Observable, of } from 'rxjs';

/** Implemented by shared/auth (Task 9). The transport is deliberately unspecified (open question U1). */
export interface SessionCredentialProvider {
  authorize(req: HttpRequest<unknown>): HttpRequest<unknown>;
  reauthenticate(): Observable<boolean>;
}

export const SESSION_CREDENTIAL_PROVIDER = new InjectionToken<SessionCredentialProvider>(
  'SESSION_CREDENTIAL_PROVIDER',
  { providedIn: 'root', factory: () => ({ authorize: (req) => req, reauthenticate: () => of(false) }) },
);

/** Implemented by shared/i18n (Task 8). */
export const LOCALE_PREFERENCE_PROVIDER = new InjectionToken<{ current(): string }>(
  'LOCALE_PREFERENCE_PROVIDER',
  { providedIn: 'root', factory: () => ({ current: () => 'en' }) },
);

export interface ActiveScope {
  readonly departmentId?: string;
  readonly branchId?: string;
}

/** Implemented by shared/permissions (Task 12). */
export const ACTIVE_SCOPE_PROVIDER = new InjectionToken<{ current(): ActiveScope | null }>(
  'ACTIVE_SCOPE_PROVIDER',
  { providedIn: 'root', factory: () => ({ current: () => null }) },
);

/**
 * Active-scope attachment is OPT-IN per request, never global (spec section 8.3).
 * Calls that must not be scope-filtered — GET /me, runtime config, own
 * notifications, global search — simply do not opt in.
 */
export const SCOPE_BOUND = new HttpContextToken<boolean>(() => false);

export function scopeBound(context = new HttpContext()): HttpContext {
  return context.set(SCOPE_BOUND, true);
}
