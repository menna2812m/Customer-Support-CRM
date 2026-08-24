import { InjectionToken } from '@angular/core';

/**
 * Runtime configuration, loaded before bootstrap.
 *
 * This is PUBLIC browser configuration: it is fully visible to anyone who opens
 * the application. It must never contain secrets, credentials, private API keys,
 * or server-only configuration (spec section 10.2).
 */
export interface AppConfig {
  readonly apiBaseUrl: string;
  readonly socketUrl: string;
  readonly enabledChannels: readonly string[];
  readonly enabledAiCapabilities: readonly string[];
  readonly featureFlagDefaults: Readonly<Record<string, boolean>>;
}

export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG');

const SECRET_KEY_PATTERN =
  /(secret|password|passwd|private[_-]?key|credential|access[_-]?token|refresh[_-]?token|api[_-]?key)/i;

/**
 * Throws if the configuration carries a secret-shaped key at any depth.
 * Enforces spec section 10.2 at runtime rather than by convention.
 */
export function assertNoSecrets(config: AppConfig): void {
  const offenders: string[] = [];

  const walk = (value: unknown, path: string): void => {
    if (value === null || typeof value !== 'object') {
      return;
    }
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      const nextPath = path ? `${path}.${key}` : key;
      if (SECRET_KEY_PATTERN.test(key)) {
        offenders.push(nextPath);
      }
      walk(child, nextPath);
    }
  };

  walk(config, '');

  if (offenders.length > 0) {
    throw new Error(
      `Runtime configuration is public browser configuration and must not contain secrets ` +
        `(spec section 10.2). Offending keys: ${offenders.join(', ')}`,
    );
  }
}
