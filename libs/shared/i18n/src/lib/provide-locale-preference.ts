import { EnvironmentProviders, inject, makeEnvironmentProviders } from '@angular/core';
import { LOCALE_PREFERENCE_PROVIDER } from '@crm/shared/http';
import { LanguageStore } from './language.store';

/** Fills in the token shared/http declared, so the Accept-Language header follows the signal. */
export function provideLocalePreference(): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: LOCALE_PREFERENCE_PROVIDER,
      useFactory: () => {
        const store = inject(LanguageStore);
        return { current: () => store.language() };
      },
    },
  ]);
}
