import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { PermissionsService } from './permissions.service';

/**
 * canMatch, deliberately not canActivate: an unauthorized user never downloads
 * the lazy chunk. Denial routes to /403 — silent redirects make permission
 * misconfiguration invisible (spec section 6.3).
 *
 * This is a UX guard, not a security boundary — the backend independently
 * enforces authorization on every request (spec section 6.1).
 */
export function requirePermission(permission: string): CanMatchFn {
  return () => {
    if (inject(PermissionsService).has(permission)) {
      return true;
    }
    return inject(Router).createUrlTree(['/403']);
  };
}
