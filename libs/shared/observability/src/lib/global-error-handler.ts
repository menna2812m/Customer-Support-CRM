import { ErrorHandler, inject, Injectable } from '@angular/core';
import { isAppError, toAppError } from '@crm/shared/http';
import { ObservabilityClient } from './noop-observability.client';

/** Uncaught exceptions are reported; users see a generic translated message (spec section 10.1). */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly client = inject(ObservabilityClient);

  handleError(error: unknown): void {
    const appError = isAppError(error) ? error : toAppError(error);
    this.client.reportError(appError, { route: location.pathname });
  }
}
