import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SessionStore } from '@crm/shared/auth';
import { requirePermission } from './require-permission.guard';

describe('requirePermission', () => {
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: Router, useValue: { createUrlTree: vi.fn(() => 'FORBIDDEN_TREE') } }],
    });
    router = TestBed.inject(Router);
    TestBed.inject(SessionStore).setIdentity({
      userId: 'u1',
      displayName: 'A',
      language: 'en',
      permissions: [{ permission: 'ticket.view', scope: 'department' }],
      departments: [],
      branches: [],
    });
  });

  it('matches the route when the permission is held', () => {
    const guard = requirePermission('ticket.view');
    expect(TestBed.runInInjectionContext(() => guard({} as never, [], {} as never))).toBe(true);
  });

  it('routes to /403 rather than redirecting silently', () => {
    const guard = requirePermission('sla.manage');
    const result = TestBed.runInInjectionContext(() => guard({} as never, [], {} as never));
    expect(result).toBe('FORBIDDEN_TREE');
    expect(router.createUrlTree).toHaveBeenCalledWith(['/403']);
  });
});
