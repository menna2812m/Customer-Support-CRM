import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  flushTranslation,
  translationProviders,
} from '../../testing/translation-harness';
import {
  ResponsiveGateComponent,
  type ResponsivePolicy,
} from './responsive-gate.component';
import { ViewportService } from './viewport.service';

class FakeViewport {
  isPhone = () => true;
  isTablet = () => false;
  isDesktop = () => false;
}

describe('ResponsiveGateComponent', () => {
  let data: BehaviorSubject<{ responsive?: ResponsivePolicy }>;

  beforeEach(() => {
    data = new BehaviorSubject<{ responsive?: ResponsivePolicy }>({});
    TestBed.configureTestingModule({
      imports: [ResponsiveGateComponent],
      providers: [
        ...translationProviders,
        { provide: ViewportService, useClass: FakeViewport },
        { provide: ActivatedRoute, useValue: { data } },
      ],
    });
    flushTranslation({
      'shell.openOnLargerScreen': 'Open this on a larger screen.',
    });
  });

  const render = (policy?: ResponsivePolicy) => {
    data.next(policy ? { responsive: policy } : {});
    const fixture = TestBed.createComponent(ResponsiveGateComponent);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  it('blocks an operational route on a phone', () => {
    expect(
      render('operational').querySelector(
        '[data-testid="small-screen-notice"]',
      ),
    ).not.toBeNull();
  });

  it('does NOT block a dashboard route on a phone', () => {
    expect(
      render('dashboard').querySelector('[data-testid="small-screen-notice"]'),
    ).toBeNull();
  });

  it('does NOT block a portal route on a phone', () => {
    expect(
      render('portal').querySelector('[data-testid="small-screen-notice"]'),
    ).toBeNull();
  });

  it('does not block when no policy is declared', () => {
    expect(
      render().querySelector('[data-testid="small-screen-notice"]'),
    ).toBeNull();
  });
});
