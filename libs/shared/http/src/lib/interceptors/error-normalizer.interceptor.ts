import { HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { toAppError } from '../app-error';

/** Converts every failure into AppError. Sits OUTSIDE retry, so it sees only final failures. */
export const errorNormalizerInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => next(req).pipe(catchError((error) => throwError(() => toAppError(error))));
