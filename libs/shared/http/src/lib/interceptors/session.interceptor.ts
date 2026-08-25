import { HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { SESSION_CREDENTIAL_PROVIDER } from '../tokens';

/** Named `session`, not `bearer`/`jwt`: the transport is pluggable (open question U1). */
export const sessionInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => next(inject(SESSION_CREDENTIAL_PROVIDER).authorize(req));
