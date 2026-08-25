import { isDevMode } from '@angular/core';

/**
 * Telemetry operates on an EXPLICIT ALLOWLIST (spec section 10.7). Only fields
 * named here are ever transmitted. There is no catch-all serialization path, so
 * customer names, contact details, ticket and chat content, attachments, message
 * bodies, user-entered search text, and arbitrary domain objects cannot leak by
 * accident. Adding a field here is a deliberate decision.
 */
export const TELEMETRY_ALLOWLIST: ReadonlySet<string> = new Set([
  'route',
  'locale',
  'direction',
  'role',
  'errorCode',
  'httpStatus',
  'traceId',
  'durationMs',
  'connectionState',
  'featureFlag',
  'appName',
]);

export function sanitizeTelemetry(
  fields: Record<string, unknown>,
): Record<string, string | number | boolean> {
  const kept: Record<string, string | number | boolean> = {};
  const dropped: string[] = [];

  for (const [key, value] of Object.entries(fields)) {
    if (!TELEMETRY_ALLOWLIST.has(key)) {
      dropped.push(key);
      continue;
    }
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      kept[key] = value;
    } else {
      dropped.push(key);
    }
  }

  if (dropped.length > 0 && isDevMode()) {
    console.warn(
      `[telemetry] dropped non-allowlisted field(s): ${dropped.join(', ')} ` +
        `(spec section 10.7). Add to TELEMETRY_ALLOWLIST only if the field carries no user content.`,
    );
  }

  return kept;
}
