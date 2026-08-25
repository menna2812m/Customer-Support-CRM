import { HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { LOCALE_PREFERENCE_PROVIDER } from '../tokens';

export const localeInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) =>
  next(
    req.clone({ setHeaders: { 'Accept-Language': inject(LOCALE_PREFERENCE_PROVIDER).current() } }),
  );
