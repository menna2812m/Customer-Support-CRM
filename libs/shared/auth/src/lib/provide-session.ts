import {
  EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
  provideAppInitializer,
  Type,
} from '@angular/core';
import { SESSION_CREDENTIAL_PROVIDER } from '@crm/shared/http';
import { SESSION_STRATEGY, SessionStrategy } from './session-strategy';

/**
 * Wires a concrete `SessionStrategy` into the application. This is the only
 * place that decides which strategy is active — swapping the development
 * strategy for a production one (OIDC redirect, JWT, session cookie, or
 * anything else) requires changing only the argument passed here, never any
 * consumer of `SESSION_STRATEGY` or `SESSION_CREDENTIAL_PROVIDER`.
 */
export function provideSession(strategy: Type<SessionStrategy>): EnvironmentProviders {
  return makeEnvironmentProviders([
    strategy,
    { provide: SESSION_STRATEGY, useExisting: strategy },
    {
      provide: SESSION_CREDENTIAL_PROVIDER,
      useFactory: () => {
        const active = inject(SESSION_STRATEGY);
        return {
          authorize: (req: Parameters<SessionStrategy['authorize']>[0]) => active.authorize(req),
          reauthenticate: () => active.reauthenticate(),
        };
      },
    },
    provideAppInitializer(() => inject(SESSION_STRATEGY).initialize()),
  ]);
}
