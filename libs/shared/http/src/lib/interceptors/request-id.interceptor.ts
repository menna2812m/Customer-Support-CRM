import { HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';

/**
 * Frontend-generated correlation identifier for stitching client logs.
 * DISTINCT from the backend traceId, which is authoritative for support
 * and debugging (spec section 8.4).
 */
export const FRONTEND_REQUEST_ID_HEADER = 'X-Frontend-Request-Id';

export const requestIdInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => next(req.clone({ setHeaders: { [FRONTEND_REQUEST_ID_HEADER]: crypto.randomUUID() } }));
