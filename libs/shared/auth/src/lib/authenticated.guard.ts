import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { SessionStore } from './session.store';

/**
 * Redirects an anonymous principal to login while preserving the intended
 * route as a query parameter — never anywhere else (not the URL path, not a
 * side-channel), so the redirect target is unambiguous and inspectable.
 */
export const authenticatedGuard: CanMatchFn = (_route, segments) => {
  const store = inject(SessionStore);
  const router = inject(Router);

  if (store.status() === 'authenticated') {
    return true;
  }

  const intended = '/' + segments.map((segment) => segment.path).join('/');
  return router.createUrlTree(['/auth/login'], { queryParams: { returnTo: intended } });
};
