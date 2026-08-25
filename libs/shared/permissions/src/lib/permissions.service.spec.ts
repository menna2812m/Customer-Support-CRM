import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { SessionStore } from '@crm/shared/auth';
import { PermissionsService } from './permissions.service';

describe('PermissionsService', () => {
  let permissions: PermissionsService;
  let session: SessionStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    permissions = TestBed.inject(PermissionsService);
    session = TestBed.inject(SessionStore);
    session.setIdentity({
      userId: 'u1',
      displayName: 'A',
      language: 'en',
      permissions: [
        { permission: 'ticket.view', scope: 'department' },
        { permission: 'ticket.assign', scope: 'own' },
        { permission: 'report.view', scope: 'all' },
      ],
      departments: [],
      branches: [],
    });
  });

  it('grants a held permission', () => {
    expect(permissions.has('ticket.view')).toBe(true);
  });

  it('denies a permission that is not held', () => {
    expect(permissions.has('sla.manage')).toBe(false);
  });

  it('denies every permission when nobody is authenticated', () => {
    session.setAnonymous();
    expect(permissions.has('ticket.view')).toBe(false);
  });

  it('reports the scope attached to a grant', () => {
    expect(permissions.scopeOf('ticket.view')).toBe('department');
    expect(permissions.scopeOf('sla.manage')).toBeNull();
  });

  it('orders scopes from narrowest to widest', () => {
    expect(permissions.hasAtLeast('ticket.view', 'own')).toBe(true);
    expect(permissions.hasAtLeast('ticket.view', 'department')).toBe(true);
    expect(permissions.hasAtLeast('ticket.view', 'all')).toBe(false);
    expect(permissions.hasAtLeast('report.view', 'all')).toBe(true);
  });

  it('recomputes when identity changes', () => {
    expect(permissions.has('kb.author')).toBe(false);
    session.setIdentity({
      userId: 'u1',
      displayName: 'A',
      language: 'en',
      permissions: [{ permission: 'kb.author', scope: 'all' }],
      departments: [],
      branches: [],
    });
    expect(permissions.has('kb.author')).toBe(true);
  });
});
