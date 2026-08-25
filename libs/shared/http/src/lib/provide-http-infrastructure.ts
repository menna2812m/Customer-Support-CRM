import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { errorNormalizerInterceptor } from './interceptors/error-normalizer.interceptor';
import { requestIdInterceptor } from './interceptors/request-id.interceptor';
import { retryInterceptor } from './interceptors/retry.interceptor';
import { sessionInterceptor } from './interceptors/session.interceptor';
import { localeInterceptor } from './interceptors/locale.interceptor';
import { scopeInterceptor } from './interceptors/scope.interceptor';

/**
 * Fixed interceptor order (spec section 8.2):
 *   session -> locale -> scope -> request-id -> error-normalizer -> retry
 *
 * Array order is outbound order, so retry sits innermost and re-issues only the
 * backend call, while the normalizer sits outside it and therefore normalizes
 * only failures that survived every retry.
 */
export function provideHttpInfrastructure(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideHttpClient(
      withInterceptors([
        sessionInterceptor,
        localeInterceptor,
        scopeInterceptor,
        requestIdInterceptor,
        errorNormalizerInterceptor,
        retryInterceptor,
      ]),
    ),
  ]);
}
