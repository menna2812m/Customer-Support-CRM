import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { SessionStore } from '@crm/shared/auth';
import { NavigationService } from '@crm/shared/permissions';
import {
  flushTranslation,
  translationProviders,
} from '../../testing/translation-harness';
import { AppShellComponent } from './app-shell.component';

@Component({
  standalone: true,
  imports: [AppShellComponent],
  template: `<crm-app-shell
    ><button shellHeaderEnd>Bell</button></crm-app-shell
  >`,
})
class HostComponent {}

const MANIFEST = [
  { id: 'tickets', labelKey: 'nav.tickets', route: '/tickets', icon: 'inbox' },
  {
    id: 'admin',
    labelKey: 'nav.admin',
    route: '/admin',
    icon: 'settings',
    permission: 'admin.view',
  },
];

describe('AppShellComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [...translationProviders, provideRouter([])],
    });
    flushTranslation({
      'shell.skipToContent': 'Skip to content',
      'shell.navigation': 'Main navigation',
      'shell.language': 'Language',
      'shell.languageName.en': 'English',
      'shell.languageName.ar': 'العربية',
      'shell.openOnLargerScreen': 'Open this on a larger screen.',
      'nav.tickets': 'Tickets',
      'nav.admin': 'Administration',
    });
    TestBed.inject(SessionStore).setIdentity({
      userId: 'u-1',
      displayName: 'Layla',
      language: 'en',
      permissions: [],
      departments: [],
      branches: [],
    });
    TestBed.inject(NavigationService).setManifest(MANIFEST);
  });

  const render = () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  it('renders only the navigation the identity may reach', () => {
    const labels = Array.from(
      render().querySelectorAll('.crm-shell__nav a'),
    ).map((link) => link.textContent?.trim());

    // 'admin.view' is not granted, so /admin must not appear.
    expect(labels).toEqual(['Tickets']);
  });

  it('projects what the application puts in the header without owning it', () => {
    expect(
      render().querySelector('.crm-shell__header-end button')?.textContent,
    ).toBe('Bell');
  });

  it('provides a skip link pointing at the labelled main region', () => {
    const element = render();
    const skip = element.querySelector<HTMLAnchorElement>('.crm-skip-link');
    const main = element.querySelector('main');

    expect(skip?.getAttribute('href')).toBe('#crm-main');
    expect(main?.id).toBe('crm-main');
    expect(main?.getAttribute('tabindex')).toBe('-1');
  });

  it('shows the signed-in identity', () => {
    expect(render().querySelector('.crm-shell__user')?.textContent).toContain(
      'Layla',
    );
  });
});
