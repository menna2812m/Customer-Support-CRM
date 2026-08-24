import { HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { ACTIVE_SCOPE_PROVIDER, SCOPE_BOUND } from '../tokens';

/** Attaches active scope ONLY when the request opted in (spec section 8.3). */
export const scopeInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  if (!req.context.get(SCOPE_BOUND)) {
    return next(req);
  }

  const scope = inject(ACTIVE_SCOPE_PROVIDER).current();
  if (!scope) {
    return next(req);
  }

  let params = req.params;
  if (scope.departmentId) {
    params = params.set('departmentId', scope.departmentId);
  }
  if (scope.branchId) {
    params = params.set('branchId', scope.branchId);
  }
  return next(req.clone({ params }));
};
