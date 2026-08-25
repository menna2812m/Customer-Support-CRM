import { HttpRequest } from '@angular/common/http';
import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { AppLanguage } from '@crm/shared/i18n';

/** PROVISIONAL scope vocabulary — open question P1. */
export type ScopeLevel = 'own' | 'team' | 'department' | 'branch' | 'all';

export interface PermissionGrant {
  readonly permission: string;
  readonly scope: ScopeLevel;
}

export interface OrgUnitRef {
  readonly id: string;
  readonly name: string;
}

/** Mirrors the `Identity` schema in the canonical contract (Task 3). */
export interface Identity {
  readonly userId: string;
  readonly displayName: string;
  readonly language: AppLanguage;
  readonly permissions: readonly PermissionGrant[];
  readonly departments: readonly OrgUnitRef[];
  readonly branches: readonly OrgUnitRef[];
}

/**
 * The authentication mechanism is deliberately unspecified (open question U1).
 * A strategy decides how credentials are acquired, attached, and refreshed;
 * nothing else in the application knows how any of it works — not even
 * whether a credential exists, let alone its transport.
 */
export interface SessionStrategy {
  initialize(): Promise<void>;
  login(): Promise<void>;
  logout(): Promise<void>;
  authorize(req: HttpRequest<unknown>): HttpRequest<unknown>;
  reauthenticate(): Observable<boolean>;
}

export const SESSION_STRATEGY = new InjectionToken<SessionStrategy>('SESSION_STRATEGY');
