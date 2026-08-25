import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { SessionStore } from '@crm/shared/auth';
import { NavigationService } from './navigation.service';
import type { NavItem } from './navigation';

const MANIFEST: NavItem[] = [
  { id: 'dashboard', labelKey: 'nav.dashboard', route: '/dashboard', icon: 'home', permission: 'dashboard.view' },
  { id: 'tickets', labelKey: 'nav.tickets', route: '/tickets', icon: 'inbox', permission: 'ticket.view' },
  {
    id: 'admin', labelKey: 'nav.admin', route: '/admin', icon: 'cog',
    children: [
      { id: 'users', labelKey: 'nav.users', route: '/admin/users', icon: 'user', permission: 'user.manage' },
      { id: 'roles', labelKey: 'nav.roles', route: '/admin/roles', icon: 'key', permission: 'role.manage' },
    ],
  },
  { id: 'notifications', labelKey: 'nav.notifications', route: '/notifications', icon: 'bell' },
];

describe('NavigationService', () => {
  let navigation: NavigationService;
  let session: SessionStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    navigation = TestBed.inject(NavigationService);
    session = TestBed.inject(SessionStore);
    navigation.setManifest(MANIFEST);
  });

  const authorize = (...permissions: string[]) =>
    session.setIdentity({
      userId: 'u1', displayName: 'A', language: 'en',
      permissions: permissions.map((permission) => ({ permission, scope: 'all' as const })),
      departments: [], branches: [],
    });

  it('shows only items whose permission is held', () => {
    authorize('ticket.view');
    expect(navigation.visible().map((item) => item.id)).toEqual(['tickets', 'notifications']);
  });

  it('keeps items that require no permission', () => {
    session.setAnonymous();
    expect(navigation.visible().map((item) => item.id)).toEqual(['notifications']);
  });

  it('filters children and drops a parent left with none', () => {
    authorize('user.manage');
    const admin = navigation.visible().find((item) => item.id === 'admin');
    expect(admin?.children?.map((child) => child.id)).toEqual(['users']);

    authorize('ticket.view');
    expect(navigation.visible().find((item) => item.id === 'admin')).toBeUndefined();
  });
});
