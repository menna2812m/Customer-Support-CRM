import { TestBed } from '@angular/core/testing';
import type { PartialMatchRouteSnapshot, Route } from '@angular/router';
import { Router, UrlSegment } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authenticatedGuard } from './authenticated.guard';
import { SessionStore } from './session.store';

// The guard's Route and PartialMatchRouteSnapshot parameters are unused by its
// logic; stand-ins keep the call sites faithful to the CanMatchFn signature
// without asserting anything about those arguments.
const unusedRoute = null as unknown as Route;
const unusedSnapshot = null as unknown as PartialMatchRouteSnapshot;

describe('authenticatedGuard', () => {
  let store: SessionStore;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: Router, useValue: { createUrlTree: vi.fn(() => 'LOGIN_TREE') } }],
    });
    store = TestBed.inject(SessionStore);
    router = TestBed.inject(Router);
  });

  it('allows an authenticated principal through', () => {
    store.setIdentity({
      userId: 'u1',
      displayName: 'A',
      language: 'en',
      permissions: [],
      departments: [],
      branches: [],
    });
    const result = TestBed.runInInjectionContext(() =>
      authenticatedGuard(unusedRoute, [], unusedSnapshot),
    );
    expect(result).toBe(true);
  });

  it('redirects an anonymous principal to login, preserving the intended route', () => {
    store.setAnonymous();
    const segments = [new UrlSegment('tickets', {}), new UrlSegment('42', {})];
    const result = TestBed.runInInjectionContext(() =>
      authenticatedGuard(unusedRoute, segments, unusedSnapshot),
    );
    expect(result).toBe('LOGIN_TREE');
    expect(router.createUrlTree).toHaveBeenCalledWith(['/auth/login'], {
      queryParams: { returnTo: '/tickets/42' },
    });
  });

  it('carries the intended route only in the returnTo query parameter, never elsewhere', () => {
    store.setAnonymous();
    TestBed.runInInjectionContext(() =>
      authenticatedGuard(unusedRoute, [new UrlSegment('tickets', {})], unusedSnapshot),
    );
    const [commands, extras] = (router.createUrlTree as unknown as { mock: { calls: unknown[][] } })
      .mock.calls[0] as [unknown[], { queryParams?: Record<string, unknown> }];
    expect(commands).toEqual(['/auth/login']);
    expect(extras.queryParams).toHaveProperty('returnTo');
    expect(Object.keys(extras.queryParams ?? {})).toEqual(['returnTo']);
  });
});
