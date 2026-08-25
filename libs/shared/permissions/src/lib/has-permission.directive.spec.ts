import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { SessionStore } from '@crm/shared/auth';
import { HasPermissionDirective } from './has-permission.directive';

@Component({
  standalone: true,
  imports: [HasPermissionDirective],
  template: `<button *appHasPermission="'ticket.assign'" data-testid="assign">Assign</button>`,
})
class HostComponent {}

describe('HasPermissionDirective', () => {
  let session: SessionStore;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostComponent] });
    session = TestBed.inject(SessionStore);
  });

  const render = () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  it('renders the element when the permission is held', () => {
    session.setIdentity({
      userId: 'u1', displayName: 'A', language: 'en',
      permissions: [{ permission: 'ticket.assign', scope: 'own' }],
      departments: [], branches: [],
    });
    expect(render().querySelector('[data-testid="assign"]')).not.toBeNull();
  });

  it('removes the element from the DOM when the permission is absent', () => {
    session.setAnonymous();
    expect(render().querySelector('[data-testid="assign"]')).toBeNull();
  });

  it('reacts to a permission change on the same rendered instance', () => {
    session.setIdentity({
      userId: 'u1', displayName: 'A', language: 'en',
      permissions: [{ permission: 'ticket.assign', scope: 'own' }],
      departments: [], branches: [],
    });
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-testid="assign"]')).not.toBeNull();

    // Same fixture, no re-creation: proves the directive is signal-reactive
    // rather than evaluating the permission once at construction time.
    session.setAnonymous();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-testid="assign"]')).toBeNull();

    session.setIdentity({
      userId: 'u1', displayName: 'A', language: 'en',
      permissions: [{ permission: 'ticket.assign', scope: 'own' }],
      departments: [], branches: [],
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-testid="assign"]')).not.toBeNull();
  });
});
