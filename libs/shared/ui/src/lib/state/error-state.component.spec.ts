import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppError } from '@crm/shared/http';
import {
  flushTranslation,
  translationProviders,
} from '../../testing/translation-harness';
import { ErrorStateComponent } from './error-state.component';

describe('ErrorStateComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ErrorStateComponent],
      providers: translationProviders,
    });
    flushTranslation({
      'errors.ticket.load_failed': 'Something went wrong.',
      'errors.retry': 'Try again',
      'errors.copyTraceId': 'Copy reference',
    });
  });

  const render = (error: AppError) => {
    const fixture = TestBed.createComponent(ErrorStateComponent);
    fixture.componentRef.setInput('error', error);
    fixture.detectChanges();
    return fixture;
  };

  it('shows the copyable reference when a traceId is present', () => {
    const element = render({
      code: 'ticket.load_failed',
      retriable: false,
      traceId: 'trace-42',
    }).nativeElement as HTMLElement;
    expect(
      element.querySelector('[data-testid="trace-id"]')?.textContent,
    ).toContain('trace-42');
  });

  it('omits the reference entirely when there is no traceId', () => {
    const element = render({ code: 'ticket.load_failed', retriable: false })
      .nativeElement as HTMLElement;
    expect(element.querySelector('[data-testid="trace-id"]')).toBeNull();
  });

  it('translates from the error code rather than showing it raw', () => {
    const element = render({ code: 'ticket.load_failed', retriable: true })
      .nativeElement as HTMLElement;
    expect(element.textContent).toContain('Something went wrong.');
    expect(element.textContent).not.toContain('ticket.load_failed');
  });

  it('emits retry when the action is used', () => {
    const fixture = render({ code: 'ticket.load_failed', retriable: true });
    const spy = vi.fn();
    fixture.componentInstance.retry.subscribe(spy);

    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('[data-testid="retry"] button')
      ?.click();

    expect(spy).toHaveBeenCalled();
  });
});
