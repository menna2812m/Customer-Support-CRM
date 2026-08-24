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

/**
 * Whole-word segments that mark a key as secret-shaped. Matched against key
 * names split on camelCase boundaries, underscores, and hyphens — never as a
 * raw substring — so that e.g. "passwordlessLoginEnabled" (segments:
 * password-less, login, enabled) is accepted while "privateKey" (segments:
 * private, key) is rejected.
 */
const SECRET_SEGMENTS = new Set([
  'secret',
  'secrets',
  'password',
  'passwd',
  'pwd',
  'credential',
  'credentials',
  'key',
  'keys',
  'token',
  'tokens',
]);

/**
 * Splits a key into lowercase segments on camelCase boundaries, underscores,
 * and hyphens, e.g. "access_token" and "accessToken" both become
 * ["access", "token"].
 */
function splitKeyIntoSegments(key: string): string[] {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    .split(/[_-]+/)
    .filter((segment) => segment.length > 0)
    .map((segment) => segment.toLowerCase());
}

/**
 * Whether a key name is secret-shaped, matched by whole segment rather than
 * by substring (spec section 10.2).
 */
function isSecretShapedKey(key: string): boolean {
  return splitKeyIntoSegments(key).some((segment) => SECRET_SEGMENTS.has(segment));
}

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
      if (isSecretShapedKey(key)) {
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
