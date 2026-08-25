import { provideLocationMocks } from '@angular/common/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, RouterOutlet, type Routes } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { flushTranslation, translationProviders } from '../../testing/translation-harness';
import { ResponsiveGateComponent } from './responsive-gate.component';
import { ViewportService } from './viewport.service';

class FakeViewport {
  isPhone = () => true;
  isTablet = () => false;
  isDesktop = () => false;
}

@Component({ standalone: true, template: 'page' })
class BlankPage {}

/**
 * The host mirrors the shell: the gate wraps the outlet rather than living
 * inside it. That placement is the whole difficulty — the gate's own
 * ActivatedRoute is the root and carries no route data — so the test has to
 * reproduce it rather than hand the component a route object directly.
 */
@Component({
  standalone: true,
  imports: [ResponsiveGateComponent, RouterOutlet],
  template: `<crm-responsive-gate><router-outlet /></crm-responsive-gate>`,
})
class HostComponent {}

const routes: Routes = [
  { path: 'operational', data: { responsive: 'operational' }, component: BlankPage },
  { path: 'dashboard', data: { responsive: 'dashboard' }, component: BlankPage },
  { path: 'portal', data: { responsive: 'portal' }, component: BlankPage },
  { path: 'undeclared', component: BlankPage },
  {
    path: 'admin',
    data: { responsive: 'operational' },
    children: [{ path: 'sla', component: BlankPage }],
  },
];

describe('ResponsiveGateComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [
        ...translationProviders,
        provideRouter(routes),
        provideLocationMocks(),
        { provide: ViewportService, useClass: FakeViewport },
      ],
    });
    flushTranslation({ 'shell.openOnLargerScreen': 'Open this on a larger screen.' });
  });

  const navigate = async (url: string) => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    await TestBed.inject(Router).navigateByUrl(url);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  const notice = (element: HTMLElement) => element.querySelector('[data-testid="small-screen-notice"]');

  it('blocks an operational route on a phone', async () => {
    expect(notice(await navigate('/operational'))).not.toBeNull();
  });

  it('blocks a child of an operational section on a phone', async () => {
    // The policy is declared on the componentless parent; the child inherits it.
    expect(notice(await navigate('/admin/sla'))).not.toBeNull();
  });

  it('does NOT block a dashboard route on a phone', async () => {
    expect(notice(await navigate('/dashboard'))).toBeNull();
  });

  it('does NOT block a portal route on a phone', async () => {
    expect(notice(await navigate('/portal'))).toBeNull();
  });

  it('does not block when no policy is declared', async () => {
    expect(notice(await navigate('/undeclared'))).toBeNull();
  });

  it('re-evaluates the policy when navigating away from a blocked route', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/operational');
    fixture.detectChanges();
    expect(notice(fixture.nativeElement)).not.toBeNull();

    await router.navigateByUrl('/dashboard');
    fixture.detectChanges();
    expect(notice(fixture.nativeElement)).toBeNull();
  });
});
