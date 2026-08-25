import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { DevSessionStrategy, provideSession } from '@crm/shared/auth';
import {
  provideAppConfig,
  type AppConfig as RuntimeConfig,
} from '@crm/shared/config';
import { provideHttpInfrastructure } from '@crm/shared/http';
import {
  LanguageResolver,
  provideAppDirection,
  provideAppTranslation,
  provideLocalePreference,
} from '@crm/shared/i18n';
import { provideObservability } from '@crm/shared/observability';
import { NavigationService } from '@crm/shared/permissions';
import { provideCrmTheme } from '@crm/shared/ui';
import { appRoutes } from './app.routes';
import { AGENT_NAVIGATION } from './navigation.manifest';

/**
 * `provideActiveScope()` and `provideRealtime()` are absent: the 2026-08-25
 * scope amendment (spec section 12.2) defers both libraries. `ACTIVE_SCOPE_PROVIDER`
 * therefore keeps the no-op default shared/http declares, so no request carries
 * scope parameters yet — the opt-in mechanism exists and is tested, only the
 * provider implementation is missing.
 */
export function buildAppConfig(runtime: RuntimeConfig): ApplicationConfig {
  return {
    providers: [
      provideAppConfig(runtime),
      provideRouter(appRoutes, withComponentInputBinding()),
      provideHttpInfrastructure(),

      provideAppTranslation(),
      provideLocalePreference(),
      provideAppDirection(),

      provideSession(DevSessionStrategy),
      provideObservability(),
      provideCrmTheme(),

      // Language before session so the pre-auth default is correct; the session
      // strategy then applies the server preference (spec section 9.3).
      provideAppInitializer(() => {
        inject(LanguageResolver).applyUnauthenticatedDefault();
        inject(NavigationService).setManifest(AGENT_NAVIGATION);
      }),
    ],
  };
}
