import { computed, inject, Injectable } from '@angular/core';
import { ScopeLevel, SessionStore } from '@crm/shared/auth';

/**
 * PROVISIONAL ordering, narrowest to widest (open question P1). The real scope
 * vocabulary must be confirmed before permission-sensitive domain work.
 */
const SCOPE_ORDER: readonly ScopeLevel[] = ['own', 'team', 'department', 'branch', 'all'];

/**
 * Frontend permission checks exist to produce a coherent experience — hiding
 * unreachable navigation, avoiding pointless requests, explaining denial.
 * They are NOT a security boundary. The backend is authoritative and must
 * enforce authorization independently (spec section 6.1).
 *
 * Permission names throughout this library are PROVISIONAL pending an
 * unresolved catalogue decision (open question P1).
 */
@Injectable({ providedIn: 'root' })
export class PermissionsService {
  private readonly session = inject(SessionStore);

  private readonly grants = computed(() => {
    const identity = this.session.identity();
    const map = new Map<string, ScopeLevel>();
    for (const grant of identity?.permissions ?? []) {
      map.set(grant.permission, grant.scope);
    }
    return map;
  });

  has(permission: string): boolean {
    return this.grants().has(permission);
  }

  scopeOf(permission: string): ScopeLevel | null {
    return this.grants().get(permission) ?? null;
  }

  hasAtLeast(permission: string, minimum: ScopeLevel): boolean {
    const held = this.scopeOf(permission);
    if (!held) {
      return false;
    }
    return SCOPE_ORDER.indexOf(held) >= SCOPE_ORDER.indexOf(minimum);
  }
}
