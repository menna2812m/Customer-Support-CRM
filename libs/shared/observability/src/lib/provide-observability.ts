import { EnvironmentProviders, ErrorHandler, makeEnvironmentProviders, Type } from '@angular/core';
import { GlobalErrorHandler } from './global-error-handler';
import { NoopObservabilityClient, ObservabilityClient } from './noop-observability.client';

export function provideObservability(
  client: Type<ObservabilityClient> = NoopObservabilityClient,
): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: ObservabilityClient, useClass: client },
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
  ]);
}
