import {
  HttpErrorResponse,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { retry, timer } from 'rxjs';
import { RETRIABLE_STATUSES } from '../app-error';

const IDEMPOTENT_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/** Capped attempts and capped backoff (spec section 8.2). */
const MAX_RETRIES = 2;
const BASE_DELAY_MS = 300;
const MAX_DELAY_MS = 4000;

function retryDelay(error: unknown, retryCount: number) {
  if (error instanceof HttpErrorResponse && error.status === 429) {
    const header = Number(error.headers.get('Retry-After'));
    if (Number.isFinite(header) && header > 0) {
      return timer(Math.min(header * 1000, MAX_DELAY_MS));
    }
  }
  return timer(Math.min(BASE_DELAY_MS * 2 ** (retryCount - 1), MAX_DELAY_MS));
}

/**
 * Retries ONLY transient failures on idempotent requests. Business errors and
 * ordinary 4xx responses are never retried (spec section 8.2).
 */
export const retryInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  if (!IDEMPOTENT_METHODS.has(req.method.toUpperCase())) {
    return next(req);
  }

  return next(req).pipe(
    retry({
      count: MAX_RETRIES,
      delay: (error, retryCount) => {
        const status = error instanceof HttpErrorResponse ? error.status : -1;
        if (!RETRIABLE_STATUSES.has(status)) {
          throw error;
        }
        return retryDelay(error, retryCount);
      },
    }),
  );
};
