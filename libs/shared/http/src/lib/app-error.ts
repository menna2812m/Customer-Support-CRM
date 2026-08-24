import { HttpErrorResponse } from '@angular/common/http';

/** The single normalized error shape the whole application handles (spec section 10.1). */
export interface AppError {
  /** Stable machine code. The frontend translates this; the server `message` is never shown. */
  readonly code: string;
  readonly httpStatus?: number;
  /** Backend-authoritative. Surfaced on actionable and system failures only (spec section 10.1). */
  readonly traceId?: string;
  readonly retriable: boolean;
  readonly details?: unknown;
}

/** Transient statuses only. Business errors and ordinary 4xx are never retriable (spec section 8.2). */
const RETRIABLE_STATUSES = new Set([0, 429, 502, 503, 504]);

interface ErrorEnvelope {
  code?: string;
  message?: string;
  details?: unknown;
  traceId?: string;
}

export function toAppError(error: unknown): AppError {
  if (error instanceof HttpErrorResponse) {
    const envelope: ErrorEnvelope =
      error.error && typeof error.error === 'object' ? (error.error as ErrorEnvelope) : {};

    return {
      code: envelope.code ?? 'http.unknown_error',
      httpStatus: error.status,
      traceId: envelope.traceId,
      retriable: RETRIABLE_STATUSES.has(error.status),
      details: envelope.details,
    };
  }

  return {
    code: 'client.unexpected_error',
    retriable: false,
    details: error instanceof Error ? error.message : error,
  };
}

export function isAppError(value: unknown): value is AppError {
  return typeof value === 'object' && value !== null && 'code' in value && 'retriable' in value;
}
