import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { APP_CONFIG, assertNoSecrets, type AppConfig } from './app-config';

const REQUIRED_FIELDS: readonly (keyof AppConfig)[] = [
  'apiBaseUrl',
  'socketUrl',
  'enabledChannels',
  'enabledAiCapabilities',
  'featureFlagDefaults',
];

/**
 * Loads runtime configuration BEFORE bootstrap so that a single build artifact
 * promotes across environments unchanged (spec section 10.2).
 */
export async function loadAppConfig(url = '/config.json'): Promise<AppConfig> {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Runtime configuration could not be loaded from ${url} (${response.status}).`);
  }

  const config = (await response.json()) as AppConfig;

  const missing = REQUIRED_FIELDS.filter((field) => config?.[field] == null);
  if (missing.length > 0) {
    throw new Error(`Runtime configuration is missing required field(s): ${missing.join(', ')}`);
  }

  assertNoSecrets(config);
  return config;
}

export function provideAppConfig(config: AppConfig): EnvironmentProviders {
  return makeEnvironmentProviders([{ provide: APP_CONFIG, useValue: config }]);
}
