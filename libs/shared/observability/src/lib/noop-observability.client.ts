import { Injectable, isDevMode } from '@angular/core';
import type { AppError } from '@crm/shared/http';
import { sanitizeTelemetry } from './telemetry';

export abstract class ObservabilityClient {
  abstract reportError(error: AppError, context?: Record<string, unknown>): void;
  abstract track(name: string, fields?: Record<string, unknown>): void;
}

/**
 * Default implementation. No vendor SDK is added: whether third-party reporting
 * is permissible may be constrained by data-residency policy (open question P2).
 * Swapping in a real client requires no change outside provideObservability.
 */
@Injectable()
export class NoopObservabilityClient extends ObservabilityClient {
  reportError(error: AppError, context: Record<string, unknown> = {}): void {
    if (isDevMode()) {
      console.error('[observability] error', {
        code: error.code,
        httpStatus: error.httpStatus,
        traceId: error.traceId,
        ...sanitizeTelemetry(context),
      });
    }
  }

  track(name: string, fields: Record<string, unknown> = {}): void {
    if (isDevMode()) {
      console.debug('[observability] event', name, sanitizeTelemetry(fields));
    }
  }
}
