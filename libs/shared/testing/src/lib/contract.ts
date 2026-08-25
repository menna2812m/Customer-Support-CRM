import { join } from 'node:path';
import SwaggerParser from '@apidevtools/swagger-parser';
import Ajv, { type ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';

const CONTRACT_PATH = join(process.cwd(), 'docs/api/openapi.yaml');

let cache: Record<string, object> | null = null;
const compiled = new Map<string, ValidateFunction>();

const ajv = addFormats(new Ajv({ strict: false, allErrors: true }));

/** Call once in the Vitest setup file, before any validation. */
export async function primeContract(): Promise<void> {
  const api = (await SwaggerParser.dereference(CONTRACT_PATH)) as {
    components?: { schemas?: Record<string, object> };
  };
  cache = api.components?.schemas ?? {};
}

function getSchemas(): Record<string, object> {
  if (!cache) {
    throw new Error('Contract not primed. Call primeContract() in the Vitest setup file.');
  }
  return cache;
}

/**
 * Validates a value against a named schema component in the canonical contract.
 * Throws with ajv's error list so a drifting mock fails loudly (spec section 8.6).
 */
export function validateAgainstContract(schemaName: string, value: unknown): void {
  const schema = getSchemas()[schemaName];
  if (!schema) {
    throw new Error(
      `Schema "${schemaName}" is not defined in the canonical contract (${CONTRACT_PATH}).`,
    );
  }

  let validate = compiled.get(schemaName);
  if (!validate) {
    validate = ajv.compile(schema);
    compiled.set(schemaName, validate);
  }

  if (!validate(value)) {
    const detail = (validate.errors ?? [])
      .map((e) => `${e.instancePath || '/'} ${e.message}`)
      .join('; ');
    throw new Error(`Value does not match contract schema "${schemaName}": ${detail}`);
  }
}
