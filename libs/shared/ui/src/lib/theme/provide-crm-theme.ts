import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { providePrimeNG } from 'primeng/config';
import { CrmPreset } from './crm-preset';

export function provideCrmTheme(): EnvironmentProviders {
  return makeEnvironmentProviders([
    providePrimeNG({
      theme: { preset: CrmPreset, options: { darkModeSelector: '.crm-dark' } },
    }),
  ]);
}
