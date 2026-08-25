import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { SessionStore } from '@crm/shared/auth';
import { resolveLandingRoute } from './landing.resolver';

describe('resolveLandingRoute', () => {
  let session: SessionStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    session = TestBed.inject(SessionStore);
  });

  const authorize = (...permissions: string[]) =>
    session.setIdentity({
      userId: 'u1',
      displayName: 'A',
      language: 'en',
      permissions: permissions.map((permission) => ({
        permission,
        scope: 'all' as const,
      })),
      departments: [],
      branches: [],
    });

  it('sends an operational user to the dashboard', () => {
    authorize('dashboard.view', 'ticket.view');
    expect(TestBed.runInInjectionContext(() => resolveLandingRoute())).toBe(
      '/dashboard',
    );
  });

  it('sends an administrator without dashboard access to user administration', () => {
    authorize('user.manage');
    expect(TestBed.runInInjectionContext(() => resolveLandingRoute())).toBe(
      '/admin/users',
    );
  });

  it('sends an auditor to the audit log', () => {
    authorize('audit.view');
    expect(TestBed.runInInjectionContext(() => resolveLandingRoute())).toBe(
      '/admin/audit-log',
    );
  });

  it('falls back to /403 rather than guessing when nothing is reachable', () => {
    authorize();
    expect(TestBed.runInInjectionContext(() => resolveLandingRoute())).toBe(
      '/403',
    );
  });
});
