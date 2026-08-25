import { inject } from '@angular/core';
import { PermissionsService } from '@crm/shared/permissions';

/**
 * The landing route is RESOLVED after authentication rather than hard-coded, so
 * adding an actor does not require changing the root route (spec section 3).
 * Order is most-specific first.
 */
const LANDING_RULES: readonly { permission: string; route: string }[] = [
  { permission: 'dashboard.view', route: '/dashboard' },
  { permission: 'ticket.view', route: '/tickets' },
  { permission: 'user.manage', route: '/admin/users' },
  { permission: 'audit.view', route: '/admin/audit-log' },
  { permission: 'report.view', route: '/reports' },
];

export function resolveLandingRoute(): string {
  const permissions = inject(PermissionsService);
  const match = LANDING_RULES.find((rule) => permissions.has(rule.permission));
  // No guessing: a principal with nothing reachable is told so explicitly.
  return match?.route ?? '/403';
}
