import { ErrorHandler } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ObservabilityClient } from './noop-observability.client';
import { provideObservability } from './provide-observability';

describe('GlobalErrorHandler', () => {
  let reportError: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    reportError = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        provideObservability(),
        { provide: ObservabilityClient, useValue: { reportError, track: vi.fn() } },
      ],
    });
  });

  it('reports an already-normalized AppError unchanged', () => {
    const appError = { code: 'ticket.not_found', retriable: false, traceId: 't-1' };
    TestBed.inject(ErrorHandler).handleError(appError);
    expect(reportError).toHaveBeenCalledWith(appError, expect.anything());
  });

  it('normalizes an unexpected throwable before reporting', () => {
    TestBed.inject(ErrorHandler).handleError(new TypeError('boom'));
    expect(reportError).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'client.unexpected_error' }),
      expect.anything(),
    );
  });
});
