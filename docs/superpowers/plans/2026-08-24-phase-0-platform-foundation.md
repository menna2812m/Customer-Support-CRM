# Phase 0 — Platform Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the platform foundation defined in section 12.1 of the architecture spec — an Nx workspace with two Angular application shells and the shared infrastructure libraries — ending with both applications booting to an authenticated, translated, direction-correct empty shell in Arabic and English.

**Architecture:** Nx integrated monorepo. Two applications (`agent-app`, `portal-app`) that contain only bootstrap, providers, layout, and root routes. All infrastructure lives in `libs/shared/*`, wired together through injection tokens so that libraries depend on interfaces rather than on each other's implementations. Every library is created only when this plan's tasks require it; no domain libraries are created at all.

**Tech Stack:** Angular (standalone APIs, Signals), TypeScript, RxJS, Nx, Vitest, Playwright, MSW, PrimeNG, Transloco (`@jsverse/transloco`) with MessageFormat, Angular CDK, stylelint.

**Spec:** `docs/superpowers/specs/2026-08-24-customer-support-crm-frontend-architecture-design.md`

---

## Global Constraints

These apply to every task. They are copied from the spec; do not reinterpret them.

- **No domain functionality.** Phase 0 builds infrastructure only. No tickets, customers, SLA, KB, reports, admin, AI, or integrations code.
- **No deferred components.** Do not create `DataTable`, `SlaClock`, `RichTextEditor`, `Timeline`, `DateRangePicker`, or comparable domain-driven components. They are created in the phase whose domain first requires them (spec section 12.1).
- **Libraries are created lazily.** Create a library only in the task that needs it. Do not pre-create empty libraries for future phases.
- **Backend authorization is authoritative.** Frontend permission and scope checks are UX only and are never a security boundary (spec section 6.1).
- **Only `libs/shared/ui` may import `primeng/*`.** Enforced by lint (spec sections 4.3, 9.4).
- **No meaningless pass-through wrappers.** A component belongs in `shared/ui` only if it adds a stable internal API, direction handling, translation, permission integration, consistent state handling, or token-driven styling (spec section 9.4).
- **Logical CSS properties are mandatory for layout.** Physical `left`/`right` properties require an explicit, documented lint exception (spec section 9.3).
- **ICU/MessageFormat is mandatory for counted strings.** Arabic has six plural categories: `zero`, `one`, `two`, `few`, `many`, `other` (spec section 9.1).
- **Locale-dependent formatting must use the `shared/i18n` abstractions.** This is not a blanket ban on Angular pipes (spec section 9.2).
- **Timestamps are ISO-8601 UTC** at the API boundary and in all internal representation (spec section 8.5).
- **Runtime configuration is public.** It must never contain secrets, credentials, private API keys, or server-only configuration (spec section 10.2).
- **Telemetry operates on an explicit allowlist.** Never transmit customer names, contact details, ticket or chat content, attachments, message bodies, user-entered search text, or arbitrary domain objects (spec section 10.7).
- **Retry only transient failures**, on idempotent requests, capped. Never retry ordinary `4xx` or business errors (spec section 8.2).
- **Active scope is opt-in per request** via `HttpContext`, never globally injected (spec section 8.3).
- **Angular version:** use the latest stable Angular supported by `@nx/angular` at the time Task 1 runs. Do not pin an older major. Use the change-detection configuration that version documents as recommended; application code must be signals-first and must not embed Zone.js-specific assumptions (spec section 10.6).
- **Performance budgets are targets, not CI gates, in Phase 0.** They are baselined after Phase 0 and the first production-like feature before becoming enforced (spec section 10.6).
- **Commit after every task.** Conventional commit messages.

---

## Open Questions: where each one binds

The spec's open-questions register (section 13) stays authoritative. This plan does **not** resolve any business question by assumption. Below is the exact task at which each item must be answered, so that a pending answer blocks only the task that genuinely needs it.

### Hard blockers

| Spec ID | Question | Blocks at | Why exactly there | If unanswered |
|---|---|---|---|---|
| **B4** | ~~Canonical API contract ownership~~ | ~~Task 3~~ | **RESOLVED 2026-08-24.** `docs/api/openapi.yaml` in this repository; jointly owned by frontend and backend; changed by pull request; breaking or shape changes need review from both sides; the document is the single source of truth and generated clients, DTOs, mocks, and server artifacts are consumers, never competing sources; may later move to a contracts repository without changing the ownership model | Not blocking |
| **B3** | Browser support matrix | **Task 15** | Task 15 defines design tokens and the logical-property CSS strategy, whose fallbacks depend on the supported browser floor | Tasks 1–14 proceed on the Angular default browserslist. Task 15 cannot start |
| **B2** | Brand and design tokens (or explicit approval to use temporary placeholder tokens) | **Task 15** | Task 15 generates the PrimeNG theme *from* tokens; the token model is what every later component consumes | Task 15 cannot start unless the user explicitly approves temporary placeholder tokens |
| **B1** | Department and branch relationship (nested which way, or orthogonal; multi-membership) | **Task 12** | Task 12 builds `ScopeContextService` and the `HttpContext` scope policy, whose data shape is exactly this relationship. Task 18's scope switcher consumes it | Tasks 1–11 and 13–17 proceed. Task 12 cannot start; Task 18 builds every part of the shell except the switcher |

### May remain open through Phase 0

| Spec ID | Question | Phase 0 interim strategy | Must be resolved before |
|---|---|---|---|
| **P1** | Final permission catalogue and scope vocabulary | Task 10 builds the engine against **provisional development fixtures** in `shared/testing`. Fixture permission names are explicitly marked provisional in code | Any Phase 1 permission-sensitive domain implementation |
| **P2** | Telemetry vendor and data-residency policy | Task 13 ships the abstraction with a **no-op/development implementation**. No vendor SDK is added | Production observability |
| **P3** | Display timezone policy | Task 6 establishes UTC ISO-8601 as the internal invariant and formats in the browser's resolved timezone. No policy is asserted | Phase 3 SLA work and Phase 5 reporting |
| **U1** | Authentication mechanism | Task 9 ships `SessionStrategy` as a pluggable interface with a development implementation. No transport is assumed | First production authentication |

### Plan-level clarification requiring user confirmation

Spec section 12.1 lists `PermissionGate` among `shared/ui` primitives. This plan places the `*appHasPermission` directive in **`shared/permissions`** (Task 11) instead, because putting it in `shared/ui` would make the design-system library depend on the permission engine and invert the intended dependency direction. Everything else in the section 12.1 `shared/ui` list stays in `shared/ui`.

**CONFIRMED 2026-08-24:** `*appHasPermission` belongs in `shared/permissions`; `shared/ui` must not depend on the permission engine.

**Related scope note.** Spec section 4.2's rule that a `ui` library injects no services beyond translation constrains **`<domain>/ui`** libraries. It does not constrain `libs/shared/ui`, whose documented contents (spec section 12.1) include the application shell. `libs/shared/ui` carries `type:ui` so features and applications may import it, and its shell components may inject `NavigationService`, `SessionStore`, `ScopeContextService`, and `RealtimeService`. Its one hard constraint remains the PrimeNG boundary.

---

## File Structure

Created across the plan, in creation order. Nothing else is created in Phase 0.

| Path | Responsibility | Task |
|---|---|---|
| `nx.json`, `package.json`, `eslint.config.mjs`, `.stylelintrc.json` | Workspace, tag rules, PrimeNG boundary, CSS rules | 1, 15 |
| `apps/agent-app/` | Agent/admin shell: bootstrap, providers, root routes | 1, 19 |
| `apps/portal-app/` | Customer portal shell | 1, 20 |
| `apps/agent-app-e2e/`, `apps/portal-app-e2e/` | Playwright suites | 1, 21 |
| `docs/api/openapi.yaml` | Draft canonical API contract | 3 |
| `libs/shared/config/` | Runtime configuration type, loader, secret assertion | 2 |
| `libs/shared/testing/` | MSW harness, handlers, provisional fixtures | 3, 10 |
| `libs/shared/http/` | `AppError`, interceptor chain, scope policy, provider composition | 4, 8, 9, 12 |
| `libs/shared/i18n/` | Transloco setup, formatting abstractions, `DirectionService`, language resolution | 5, 6, 7, 8 |
| `libs/shared/auth/` | `SessionStrategy` abstraction, dev implementation, auth guard | 9 |
| `libs/shared/permissions/` | Permission engine, guard, directive, navigation manifest, scope context | 10, 11, 12 |
| `libs/shared/observability/` | Telemetry abstraction, allowlist, global `ErrorHandler` | 13 |
| `libs/shared/realtime/` | Connection manager, topic multiplexing, reconnect | 14 |
| `libs/shared/ui/` | Tokens, PrimeNG theme, primitives, application shell | 15, 16, 17, 18 |

---

## Task Overview

| # | Task | Deliverable | Gated by |
|---|---|---|---|
| 1 | Workspace, applications, enforced boundaries | Two apps build; a boundary violation fails lint | — |
| 2 | Runtime configuration | Config loads before bootstrap; secrets rejected | — |
| 3 | Draft API contract and MSW harness | Handlers validated against the contract | B4 |
| 4 | HTTP core: `AppError`, normalizer, request id, retry | Typed errors; transient-only retry | — |
| 5 | Translation core | Transloco with ICU and lazy scopes | — |
| 6 | Locale-aware formatting | `Intl` abstractions that follow a runtime switch | — |
| 7 | Direction | `DirectionService`, document and CDK synchronized | — |
| 8 | Language resolution and locale interceptor | Resolution order; device vs. server preference | — |
| 9 | Session abstraction | Pluggable strategy, dev implementation, guard | — |
| 10 | Permission engine and route guard | `canMatch` guard; `/403` | — |
| 11 | Permission UI surfaces | Directive and navigation manifest | — |
| 12 | Scope context and scope policy | Opt-in scope attachment | B1 |
| 13 | Observability | Allowlisted telemetry, global error handler | — |
| 14 | Realtime | Multiplexed connection with reconnect | — |
| 15 | Design tokens, theme, CSS rules | Tokens drive the PrimeNG theme; logical-property lint | B2, B3 |
| 16 | UI primitives I | Directional icon, translated button, form field | — |
| 17 | UI primitives II | Dialog, confirm, toast, empty/error/loading states | — |
| 18 | Application shell | Layout, switchers, route-specific responsive gate | B1 (switcher only) |
| 19 | Agent application wiring | Boots to shell with landing resolution | — |
| 20 | Portal application wiring | Boots to shell, mobile-first | — |
| 21 | Acceptance E2E and CI | Both apps verified in `ar` and `en`; CI green | — |

---

### Task 1: Workspace, applications, enforced boundaries

The deliverable is a workspace where the architecture's boundary rules are mechanically enforced. The "test" here is a lint run against a deliberate violation — that is what proves the rules are live rather than merely configured.

**Files:**
- Create: `package.json`, `nx.json`, `tsconfig.base.json` (generated)
- Create: `eslint.config.mjs`
- Create: `apps/agent-app/`, `apps/portal-app/`, `apps/agent-app-e2e/`, `apps/portal-app-e2e/` (generated)
- Create: `.gitignore`
- Temporary: `apps/agent-app/src/app/boundary-probe.ts` (created and deleted within this task)

**Interfaces:**
- Consumes: nothing
- Produces: the tag vocabulary every later task uses — `type:app`, `type:feature`, `type:data-access`, `type:ui`, `type:model`, `type:util`, and `scope:agent`, `scope:portal`, `scope:shared`. Every library generated in Tasks 2–17 is tagged `scope:shared` plus one `type:*`.

- [ ] **Step 1: Initialize the workspace in the existing repository**

The repository already contains `docs/` and a git history. Do not run `create-nx-workspace`, which requires an empty directory. Initialize in place:

```bash
cd D:/Me/Customer-Support-CRM
npm init -y
npx nx@latest init --interactive=false
npx nx add @nx/angular
```

Set the package name so generated import aliases are short. Edit `package.json`:

```json
{
  "name": "crm"
}
```

**Import alias convention.** Every library generated in this plan is imported as
`@crm/shared/<name>` — `@crm/shared/config`, `@crm/shared/http`, `@crm/shared/i18n`,
`@crm/shared/auth`, `@crm/shared/permissions`, `@crm/shared/observability`,
`@crm/shared/realtime`, `@crm/shared/ui`, `@crm/shared/testing`. Nx's generator will
propose `@crm/shared-config`-style aliases; after each library generation, normalize its entry in
`tsconfig.base.json` to the slashed form. Every code sample in this plan assumes it:

```json
{
  "compilerOptions": {
    "paths": {
      "@crm/shared/config": ["libs/shared/config/src/index.ts"],
      "@crm/shared/http": ["libs/shared/http/src/index.ts"]
    }
  }
}
```

- [ ] **Step 2: Generate both applications**

```bash
npx nx g @nx/angular:application agent-app \
  --directory=apps/agent-app \
  --style=scss --routing --standalone \
  --unitTestRunner=vitest --e2eTestRunner=playwright \
  --tags=scope:agent,type:app --no-interactive

npx nx g @nx/angular:application portal-app \
  --directory=apps/portal-app \
  --style=scss --routing --standalone \
  --unitTestRunner=vitest --e2eTestRunner=playwright \
  --tags=scope:portal,type:app --no-interactive
```

- [ ] **Step 3: Write the boundary rules**

Replace the `@nx/enforce-module-boundaries` entry in `eslint.config.mjs` with the full constraint set, and add the PrimeNG restriction:

```js
// eslint.config.mjs
import nx from '@nx/eslint-plugin';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/angular'],
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: [],
          depConstraints: [
            // --- layer rules (spec section 4.3) ---
            {
              sourceTag: 'type:app',
              onlyDependOnLibsWithTags: [
                'type:feature', 'type:ui', 'type:data-access', 'type:model', 'type:util',
              ],
            },
            {
              sourceTag: 'type:feature',
              onlyDependOnLibsWithTags: ['type:data-access', 'type:ui', 'type:model', 'type:util'],
            },
            {
              sourceTag: 'type:data-access',
              onlyDependOnLibsWithTags: ['type:model', 'type:util'],
            },
            {
              sourceTag: 'type:ui',
              onlyDependOnLibsWithTags: ['type:ui', 'type:model', 'type:util'],
            },
            { sourceTag: 'type:model', onlyDependOnLibsWithTags: [] },
            { sourceTag: 'type:util', onlyDependOnLibsWithTags: ['type:util', 'type:model'] },

            // --- application separation (spec section 4.3) ---
            { sourceTag: 'scope:agent', onlyDependOnLibsWithTags: ['scope:agent', 'scope:shared'] },
            { sourceTag: 'scope:portal', onlyDependOnLibsWithTags: ['scope:portal', 'scope:shared'] },
            { sourceTag: 'scope:shared', onlyDependOnLibsWithTags: ['scope:shared'] },
          ],
        },
      ],

      // --- PrimeNG boundary (spec sections 4.3, 9.4) ---
      // Overridden to 'off' only in libs/shared/ui/eslint.config.mjs.
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['primeng', 'primeng/*', '@primeuix/*'],
              message:
                'PrimeNG may only be imported inside libs/shared/ui (spec sections 4.3, 9.4). ' +
                'Consume it through a shared/ui component instead.',
            },
          ],
        },
      ],
    },
  },
];
```

- [ ] **Step 4: Write the failing boundary probe**

Create a file that violates the application-separation rule. `@nx/enforce-module-boundaries` resolves by tag, so the probe imports across scopes using a path alias that will exist once libraries do. Until then, prove the layer rule instead by importing an app from an app:

```ts
// apps/agent-app/src/app/boundary-probe.ts
// TEMPORARY — deleted in Step 6. Proves the boundary rules are enforced.
import { Button } from 'primeng/button';

export const probe = Button;
```

- [ ] **Step 5: Run lint to verify the probe fails**

```bash
npx nx lint agent-app
```

Expected: FAIL, with the message `PrimeNG may only be imported inside libs/shared/ui`. If lint passes, the rule is not wired — fix `eslint.config.mjs` before continuing.

- [ ] **Step 6: Delete the probe and verify lint passes**

```bash
rm apps/agent-app/src/app/boundary-probe.ts
npx nx lint agent-app
npx nx lint portal-app
```

Expected: PASS for both.

- [ ] **Step 7: Verify both applications build**

```bash
npx nx build agent-app
npx nx build portal-app
```

Expected: both succeed.

- [ ] **Step 8: Add the library generation wrappers**

Spec section 12.1 calls for generators so conventions cannot drift. Rather than a custom Nx generator, wrap the stock ones with the correct tags baked in — the tags are the part people forget, and a mistagged library silently loses its boundary enforcement.

```json
// package.json  (scripts)
{
  "scripts": {
    "gen:shared": "nx g @nx/angular:library --unitTestRunner=vitest --standalone --skipModule --tags=scope:shared,type:util --no-interactive",
    "gen:feature": "nx g @nx/angular:library --unitTestRunner=vitest --standalone --skipModule --tags=type:feature --no-interactive",
    "gen:data-access": "nx g @nx/angular:library --unitTestRunner=vitest --standalone --skipModule --tags=type:data-access --no-interactive",
    "gen:ui": "nx g @nx/angular:library --unitTestRunner=vitest --standalone --skipModule --tags=type:ui --no-interactive",
    "gen:model": "nx g @nx/js:library --unitTestRunner=vitest --bundler=none --tags=type:model --no-interactive"
  }
}
```

Record the convention in `docs/api/../..`-adjacent developer notes as part of the Task 21 completion report: a `feature-*` library additionally carries `scope:agent` or `scope:portal`, and after generation its `tsconfig.base.json` alias is normalized to the slashed form from Step 1.

- [ ] **Step 9: Write the `.gitignore`**

The repository already has a `.gitignore` containing `.superpowers/`. **Extend it; do not overwrite it** — that entry keeps the execution scratch workspace out of git.

```gitignore
.superpowers/
node_modules
dist
tmp
.nx/cache
.nx/workspace-data
.angular
coverage
test-results
playwright-report
*.local
```

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat(workspace): initialize Nx workspace with agent and portal applications

Adds enforced module boundaries: layer constraints, agent/portal scope
separation, and the PrimeNG import restriction limiting primeng/* to
libs/shared/ui. Spec sections 4.1-4.3."
```

**Completion criteria:** both applications build and lint clean; a PrimeNG import outside `shared/ui` fails lint; the tag vocabulary is in place.

---

### Task 2: Runtime configuration

**Files:**
- Create: `libs/shared/config/src/lib/app-config.ts`
- Create: `libs/shared/config/src/lib/app-config.spec.ts`
- Create: `libs/shared/config/src/lib/load-app-config.ts`
- Create: `libs/shared/config/src/lib/load-app-config.spec.ts`
- Create: `libs/shared/config/src/index.ts`
- Create: `apps/agent-app/public/config.json`, `apps/portal-app/public/config.json`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `interface AppConfig { apiBaseUrl: string; socketUrl: string; enabledChannels: string[]; enabledAiCapabilities: string[]; featureFlagDefaults: Record<string, boolean>; }`
  - `const APP_CONFIG: InjectionToken<AppConfig>`
  - `function assertNoSecrets(config: AppConfig): void` — throws on secret-shaped keys
  - `function loadAppConfig(url?: string): Promise<AppConfig>` — default url `/config.json`
  - `function provideAppConfig(config: AppConfig): EnvironmentProviders`

- [ ] **Step 1: Generate the library**

```bash
npx nx g @nx/angular:library shared-config \
  --directory=libs/shared/config \
  --unitTestRunner=vitest --standalone --skipModule \
  --tags=scope:shared,type:util --no-interactive
```

- [ ] **Step 2: Write the failing test for the secret assertion**

Spec section 10.2: runtime configuration is public and must never carry secrets.

```ts
// libs/shared/config/src/lib/app-config.spec.ts
import { describe, expect, it } from 'vitest';
import { assertNoSecrets, type AppConfig } from './app-config';

const base: AppConfig = {
  apiBaseUrl: 'https://api.example.test',
  socketUrl: 'wss://api.example.test/ws',
  enabledChannels: ['email'],
  enabledAiCapabilities: [],
  featureFlagDefaults: {},
};

describe('assertNoSecrets', () => {
  it('accepts a configuration containing only public values', () => {
    expect(() => assertNoSecrets(base)).not.toThrow();
  });

  it.each([
    'apiSecret',
    'clientSecret',
    'password',
    'privateKey',
    'accessToken',
    'apiKey',
    'credentials',
  ])('rejects a configuration carrying a "%s" key', (key) => {
    const polluted = { ...base, [key]: 'anything' } as unknown as AppConfig;
    expect(() => assertNoSecrets(polluted)).toThrowError(/public browser configuration/i);
  });

  it('detects secret-shaped keys nested inside objects', () => {
    const polluted = {
      ...base,
      featureFlagDefaults: { nested: true },
      extra: { deeper: { clientSecret: 'x' } },
    } as unknown as AppConfig;
    expect(() => assertNoSecrets(polluted)).toThrowError(/clientSecret/);
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

```bash
npx nx test shared-config
```

Expected: FAIL — `assertNoSecrets` is not exported from `./app-config`.

- [ ] **Step 4: Implement the config type and assertion**

```ts
// libs/shared/config/src/lib/app-config.ts
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
```

- [ ] **Step 5: Run the test to verify it passes**

```bash
npx nx test shared-config
```

Expected: PASS.

- [ ] **Step 6: Write the failing test for the loader**

```ts
// libs/shared/config/src/lib/load-app-config.spec.ts
import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadAppConfig } from './load-app-config';

const valid = {
  apiBaseUrl: 'https://api.example.test',
  socketUrl: 'wss://api.example.test/ws',
  enabledChannels: [],
  enabledAiCapabilities: [],
  featureFlagDefaults: {},
};

const respondWith = (body: unknown, ok = true) =>
  vi.fn().mockResolvedValue({ ok, status: ok ? 200 : 500, json: async () => body } as Response);

afterEach(() => vi.unstubAllGlobals());

describe('loadAppConfig', () => {
  it('loads and returns the configuration document', async () => {
    vi.stubGlobal('fetch', respondWith(valid));
    await expect(loadAppConfig()).resolves.toEqual(valid);
  });

  it('requests /config.json by default', async () => {
    const fetchMock = respondWith(valid);
    vi.stubGlobal('fetch', fetchMock);
    await loadAppConfig();
    expect(fetchMock).toHaveBeenCalledWith('/config.json', { cache: 'no-store' });
  });

  it('fails when a required field is missing', async () => {
    vi.stubGlobal('fetch', respondWith({ ...valid, apiBaseUrl: undefined }));
    await expect(loadAppConfig()).rejects.toThrowError(/apiBaseUrl/);
  });

  it('fails when the document carries a secret', async () => {
    vi.stubGlobal('fetch', respondWith({ ...valid, clientSecret: 'x' }));
    await expect(loadAppConfig()).rejects.toThrowError(/must not contain secrets/i);
  });

  it('fails when the request is unsuccessful', async () => {
    vi.stubGlobal('fetch', respondWith({}, false));
    await expect(loadAppConfig()).rejects.toThrowError(/could not be loaded/i);
  });
});
```

- [ ] **Step 7: Run the test to verify it fails**

```bash
npx nx test shared-config
```

Expected: FAIL — `loadAppConfig` is not defined.

- [ ] **Step 8: Implement the loader and provider**

```ts
// libs/shared/config/src/lib/load-app-config.ts
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

  const missing = REQUIRED_FIELDS.filter((field) => config?.[field] === undefined);
  if (missing.length > 0) {
    throw new Error(`Runtime configuration is missing required field(s): ${missing.join(', ')}`);
  }

  assertNoSecrets(config);
  return config;
}

export function provideAppConfig(config: AppConfig): EnvironmentProviders {
  return makeEnvironmentProviders([{ provide: APP_CONFIG, useValue: config }]);
}
```

```ts
// libs/shared/config/src/index.ts
export { APP_CONFIG, assertNoSecrets, type AppConfig } from './lib/app-config';
export { loadAppConfig, provideAppConfig } from './lib/load-app-config';
```

- [ ] **Step 9: Run the tests to verify they pass**

```bash
npx nx test shared-config
```

Expected: PASS, all nine cases.

- [ ] **Step 10: Add the development configuration documents**

```json
// apps/agent-app/public/config.json
{
  "apiBaseUrl": "http://localhost:3000/api",
  "socketUrl": "ws://localhost:3000/ws",
  "enabledChannels": [],
  "enabledAiCapabilities": [],
  "featureFlagDefaults": {}
}
```

Write the identical document to `apps/portal-app/public/config.json`.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat(config): add pre-bootstrap runtime configuration loader

Loads public browser configuration from config.json before bootstrap so one
build artifact promotes across environments. Rejects secret-shaped keys at any
depth. Spec section 10.2."
```

**Completion criteria:** configuration loads before bootstrap from an external document; a document containing a secret-shaped key fails loudly; no environment value is compiled into the bundle.

---

### Task 3: Draft canonical API contract and MSW harness

**Blocked by B4** (canonical API contract ownership). Do not start until the user has decided where the contract lives permanently and who merges changes to it. The draft may originate here, but its end state is one canonical contract shared by frontend, backend, mocks, and tests (spec section 8.5).

This task defines only the **envelope and bootstrap** contract. It defines no domain resources — those arrive with their phases.

**Files:**
- Create: `docs/api/openapi.yaml`
- Create: `libs/shared/testing/src/lib/handlers.ts`
- Create: `libs/shared/testing/src/lib/msw-node.ts`
- Create: `libs/shared/testing/src/lib/contract.spec.ts`
- Create: `libs/shared/testing/src/index.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `const handlers: RequestHandler[]` — MSW handlers for `/config.json` and `GET /me`
  - `const mswServer: SetupServerApi` — node server for unit and component tests
  - `function validateAgainstContract(schemaName: string, value: unknown): void` — throws with ajv errors
  - The contract component names later tasks depend on: `Error`, `ListEnvelope`, `Identity`, `PermissionGrant`, `OrgUnitRef`

- [ ] **Step 1: Generate the library and install dependencies**

```bash
npx nx g @nx/js:library shared-testing \
  --directory=libs/shared/testing \
  --unitTestRunner=vitest --bundler=none \
  --tags=scope:shared,type:util --no-interactive

npm install --save-dev msw ajv ajv-formats @apidevtools/swagger-parser
```

- [ ] **Step 2: Write the draft contract**

```yaml
# docs/api/openapi.yaml
openapi: 3.1.0
info:
  title: Customer Support CRM API (draft)
  version: 0.1.0
  description: >
    Draft contract published BY the frontend, describing what it requires of any
    backend (spec section 8.5). Phase 0 defines envelopes and bootstrap only;
    domain resources are added by the phase that introduces them.

    OWNERSHIP (B4, resolved 2026-08-24): this document is the CANONICAL contract
    and the single source of truth. It lives in this repository at
    docs/api/openapi.yaml and is jointly owned by frontend and backend. Changes
    are made through pull requests; breaking or API-shape changes require review
    from both a frontend and a backend representative. Generated clients, DTOs,
    mocks, and server artifacts are CONSUMERS of this document and must never
    become competing sources of truth. If repository separation later makes this
    workflow difficult, the contract may move to a dedicated contracts
    repository without changing the ownership model.

paths:
  /me:
    get:
      operationId: getMe
      summary: Bootstrap identity, permissions, memberships, and language preference
      responses:
        '200':
          description: The authenticated principal
          content:
            application/json:
              schema: { $ref: '#/components/schemas/Identity' }
        '401':
          description: Not authenticated
          content:
            application/json:
              schema: { $ref: '#/components/schemas/Error' }

components:
  schemas:
    Error:
      type: object
      required: [code, message]
      properties:
        code:
          type: string
          description: >
            Stable machine code. The FRONTEND translates this; `message` is a
            developer-facing diagnostic and is never shown to users.
        message: { type: string }
        details: {}
        traceId:
          type: string
          description: Backend-authoritative identifier, surfaced on actionable failures.
      additionalProperties: false

    ListEnvelope:
      type: object
      required: [items, page, pageSize, total]
      description: >
        The shape every collection endpoint returns. Query parameters are page,
        pageSize, sort, q, filter[...], and departmentId/branchId where the
        endpoint is scope-bound.
      properties:
        items: { type: array, items: {} }
        page: { type: integer, minimum: 1 }
        pageSize: { type: integer, minimum: 1 }
        total: { type: integer, minimum: 0 }
      additionalProperties: false

    OrgUnitRef:
      type: object
      required: [id, name]
      properties:
        id: { type: string }
        name: { type: string }
      additionalProperties: false

    PermissionGrant:
      type: object
      required: [permission, scope]
      description: >
        PROVISIONAL. The real permission catalogue and scope vocabulary are open
        question P1 and must be confirmed before permission-sensitive domain work.
      properties:
        permission: { type: string }
        scope:
          type: string
          enum: [own, team, department, branch, all]
      additionalProperties: false

    Identity:
      type: object
      required: [userId, displayName, language, permissions, departments, branches]
      properties:
        userId: { type: string }
        displayName: { type: string }
        language:
          type: string
          enum: [ar, en]
          description: Server-side per-user language preference (spec section 9.3).
        permissions:
          type: array
          items: { $ref: '#/components/schemas/PermissionGrant' }
        departments:
          type: array
          items: { $ref: '#/components/schemas/OrgUnitRef' }
        branches:
          type: array
          items: { $ref: '#/components/schemas/OrgUnitRef' }
      additionalProperties: false
```

- [ ] **Step 3: Write the failing contract test**

```ts
// libs/shared/testing/src/lib/contract.spec.ts
import { describe, expect, it } from 'vitest';
import { handlers } from './handlers';
import { validateAgainstContract } from './contract';

const invokeHandler = async (method: string, url: string): Promise<unknown> => {
  const response = await fetch(url, { method });
  return response.json();
};

describe('MSW handlers conform to the canonical contract', () => {
  it('exposes a handler for GET /me', () => {
    expect(handlers.length).toBeGreaterThan(0);
  });

  it('GET /me matches the Identity schema', async () => {
    const body = await invokeHandler('GET', 'http://localhost/api/me');
    expect(() => validateAgainstContract('Identity', body)).not.toThrow();
  });

  it('rejects a payload that violates the Identity schema', () => {
    expect(() => validateAgainstContract('Identity', { userId: 1 })).toThrowError(/Identity/);
  });

  it('rejects an unknown schema name', () => {
    expect(() => validateAgainstContract('NoSuchSchema', {})).toThrowError(/NoSuchSchema/);
  });

  it('accepts a well-formed Error envelope', () => {
    expect(() =>
      validateAgainstContract('Error', { code: 'ticket.not_found', message: 'Not found', traceId: 't-1' }),
    ).not.toThrow();
  });
});
```

- [ ] **Step 4: Run the test to verify it fails**

```bash
npx nx test shared-testing
```

Expected: FAIL — `./handlers` and `./contract` do not exist.

- [ ] **Step 5: Implement the contract validator**

`swagger-parser` dereferences asynchronously, so the contract is primed once in the Vitest setup file and cached; validation itself stays synchronous.

```ts
// libs/shared/testing/src/lib/contract.ts
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
```

```ts
// libs/shared/testing/src/lib/vitest-setup.ts
import { beforeAll } from 'vitest';
import { primeContract } from './contract';

beforeAll(async () => {
  await primeContract();
});
```

Register it in `libs/shared/testing/vite.config.ts` under `test.setupFiles`.

- [ ] **Step 6: Implement the handlers and the node server**

```ts
// libs/shared/testing/src/lib/fixtures.ts
/**
 * PROVISIONAL development fixtures (open question P1). Permission names here are
 * placeholders and MUST be replaced with the confirmed catalogue before any
 * permission-sensitive domain implementation.
 */
export const PROVISIONAL_IDENTITY = {
  userId: 'user-1',
  displayName: 'Test Agent',
  language: 'en' as const,
  permissions: [
    { permission: 'dashboard.view', scope: 'own' as const },
    { permission: 'ticket.view', scope: 'department' as const },
    { permission: 'ticket.create', scope: 'department' as const },
    { permission: 'customer.view', scope: 'department' as const },
  ],
  departments: [{ id: 'dept-1', name: 'Support' }],
  branches: [{ id: 'branch-1', name: 'Riyadh' }],
};
```

```ts
// libs/shared/testing/src/lib/handlers.ts
import { http, HttpResponse } from 'msw';
import { PROVISIONAL_IDENTITY } from './fixtures';

export const handlers = [
  http.get('*/config.json', () =>
    HttpResponse.json({
      apiBaseUrl: 'http://localhost/api',
      socketUrl: 'ws://localhost/ws',
      enabledChannels: [],
      enabledAiCapabilities: [],
      featureFlagDefaults: {},
    }),
  ),

  http.get('*/api/me', () => HttpResponse.json(PROVISIONAL_IDENTITY)),
];
```

```ts
// libs/shared/testing/src/lib/msw-node.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const mswServer = setupServer(...handlers);
```

```ts
// libs/shared/testing/src/index.ts
export { handlers } from './lib/handlers';
export { mswServer } from './lib/msw-node';
export { PROVISIONAL_IDENTITY } from './lib/fixtures';
export { primeContract, validateAgainstContract } from './lib/contract';
```

- [ ] **Step 7: Start the MSW server in the test setup**

```ts
// libs/shared/testing/src/lib/vitest-setup.ts  (extended)
import { afterAll, afterEach, beforeAll } from 'vitest';
import { primeContract } from './contract';
import { mswServer } from './msw-node';

beforeAll(async () => {
  await primeContract();
  mswServer.listen({ onUnhandledRequest: 'error' });
});
afterEach(() => mswServer.resetHandlers());
afterAll(() => mswServer.close());
```

- [ ] **Step 8: Run the tests to verify they pass**

```bash
npx nx test shared-testing
```

Expected: PASS, all five cases.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(testing): add draft API contract and contract-validated MSW harness

Publishes the envelope and bootstrap contract the frontend requires, and an MSW
handler set validated against it so mocks cannot drift. Permission fixtures are
marked provisional pending open question P1. Spec sections 8.5, 8.6."
```

**Completion criteria:** the draft contract defines `Error`, `ListEnvelope`, `Identity`, `PermissionGrant`, and `OrgUnitRef`; MSW handlers exist for `/config.json` and `GET /me`; a handler whose response drifts from the contract fails a test; permission fixtures are explicitly labelled provisional.

---

### Task 4: HTTP core — typed errors, request identity, transient retry

Builds the parts of the interceptor chain that depend on nothing outside this library. The session, locale, and scope interceptors are wired in Tasks 9, 8, and 12 respectively, through tokens defined here.

**Files:**
- Create: `libs/shared/http/src/lib/app-error.ts`, `app-error.spec.ts`
- Create: `libs/shared/http/src/lib/tokens.ts`
- Create: `libs/shared/http/src/lib/interceptors/error-normalizer.interceptor.ts`
- Create: `libs/shared/http/src/lib/interceptors/request-id.interceptor.ts`
- Create: `libs/shared/http/src/lib/interceptors/retry.interceptor.ts`, `retry.interceptor.spec.ts`
- Create: `libs/shared/http/src/lib/provide-http-infrastructure.ts`, `provide-http-infrastructure.spec.ts`
- Create: `libs/shared/http/src/index.ts`

**Interfaces:**
- Consumes: `APP_CONFIG` from `@crm/shared/config`
- Produces:
  - `interface AppError { code: string; httpStatus?: number; traceId?: string; retriable: boolean; details?: unknown; }`
  - `function toAppError(error: unknown): AppError`
  - `const SESSION_CREDENTIAL_PROVIDER: InjectionToken<SessionCredentialProvider>` where `interface SessionCredentialProvider { authorize(req: HttpRequest<unknown>): HttpRequest<unknown>; reauthenticate(): Observable<boolean>; }`
  - `const LOCALE_PREFERENCE_PROVIDER: InjectionToken<{ current(): string }>`
  - `const ACTIVE_SCOPE_PROVIDER: InjectionToken<{ current(): ActiveScope | null }>`
  - `const SCOPE_BOUND: HttpContextToken<boolean>` — default `false`
  - `function scopeBound(): HttpContext` — convenience for opting a request in
  - `function provideHttpInfrastructure(): EnvironmentProviders`

- [ ] **Step 1: Generate the library**

```bash
npx nx g @nx/angular:library shared-http \
  --directory=libs/shared/http \
  --unitTestRunner=vitest --standalone --skipModule \
  --tags=scope:shared,type:util --no-interactive
```

- [ ] **Step 2: Write the failing test for `toAppError`**

```ts
// libs/shared/http/src/lib/app-error.spec.ts
import { HttpErrorResponse } from '@angular/common/http';
import { describe, expect, it } from 'vitest';
import { toAppError } from './app-error';

const httpError = (status: number, error: unknown) =>
  new HttpErrorResponse({ status, error, url: 'http://localhost/api/x' });

describe('toAppError', () => {
  it('maps a backend error envelope onto AppError', () => {
    const result = toAppError(
      httpError(404, { code: 'ticket.not_found', message: 'Not found', traceId: 'trace-9' }),
    );
    expect(result).toEqual({
      code: 'ticket.not_found',
      httpStatus: 404,
      traceId: 'trace-9',
      retriable: false,
      details: undefined,
    });
  });

  it('preserves structured details for field validation', () => {
    const details = { fields: { title: 'required' } };
    const result = toAppError(httpError(422, { code: 'validation.failed', message: 'x', details }));
    expect(result.details).toEqual(details);
  });

  it('marks network failure (status 0) retriable', () => {
    expect(toAppError(httpError(0, null)).retriable).toBe(true);
  });

  it.each([502, 503, 504, 429])('marks status %i retriable', (status) => {
    expect(toAppError(httpError(status, null)).retriable).toBe(true);
  });

  it.each([400, 401, 403, 404, 409, 422])('marks status %i non-retriable', (status) => {
    expect(toAppError(httpError(status, null)).retriable).toBe(false);
  });

  it('falls back to a generic code when the backend sends no envelope', () => {
    const result = toAppError(httpError(500, 'plain text failure'));
    expect(result.code).toBe('http.unknown_error');
    expect(result.httpStatus).toBe(500);
  });

  it('wraps a non-HTTP throwable', () => {
    const result = toAppError(new TypeError('boom'));
    expect(result).toEqual({ code: 'client.unexpected_error', retriable: false, details: 'boom' });
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

```bash
npx nx test shared-http
```

Expected: FAIL — `toAppError` is not defined.

- [ ] **Step 4: Implement `AppError`**

```ts
// libs/shared/http/src/lib/app-error.ts
import { HttpErrorResponse } from '@angular/common/http';

/** The single normalized error shape the whole application handles (spec section 10.1). */
export interface AppError {
  /** Stable machine code. The frontend translates this; the server `message` is never shown. */
  readonly code: string;
  readonly httpStatus?: number;
  /** Backend-authoritative. Surfaced on actionable and system failures only (spec section 10.1). */
  readonly traceId?: string;
  readonly retriable: boolean;
  readonly details?: unknown;
}

/** Transient statuses only. Business errors and ordinary 4xx are never retriable (spec section 8.2). */
const RETRIABLE_STATUSES = new Set([0, 429, 502, 503, 504]);

interface ErrorEnvelope {
  code?: string;
  message?: string;
  details?: unknown;
  traceId?: string;
}

export function toAppError(error: unknown): AppError {
  if (error instanceof HttpErrorResponse) {
    const envelope: ErrorEnvelope =
      error.error && typeof error.error === 'object' ? (error.error as ErrorEnvelope) : {};

    return {
      code: envelope.code ?? 'http.unknown_error',
      httpStatus: error.status,
      traceId: envelope.traceId,
      retriable: RETRIABLE_STATUSES.has(error.status),
      details: envelope.details,
    };
  }

  return {
    code: 'client.unexpected_error',
    retriable: false,
    details: error instanceof Error ? error.message : error,
  };
}

export function isAppError(value: unknown): value is AppError {
  return typeof value === 'object' && value !== null && 'code' in value && 'retriable' in value;
}
```

- [ ] **Step 5: Run the test to verify it passes**

```bash
npx nx test shared-http
```

Expected: PASS, all cases.

- [ ] **Step 6: Write the failing test for the retry interceptor**

```ts
// libs/shared/http/src/lib/interceptors/retry.interceptor.spec.ts
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach } from 'vitest';
import { retryInterceptor } from './retry.interceptor';

describe('retryInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([retryInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  it('retries an idempotent GET on 503 and succeeds on the second attempt', async () => {
    const promise = new Promise((resolve) => http.get('/api/x').subscribe(resolve));

    backend.expectOne('/api/x').flush(null, { status: 503, statusText: 'Unavailable' });
    await Promise.resolve();
    backend.expectOne('/api/x').flush({ ok: true });

    await expect(promise).resolves.toEqual({ ok: true });
  });

  it('does not retry a 400', async () => {
    const promise = new Promise((_, reject) => http.get('/api/x').subscribe({ error: reject }));
    backend.expectOne('/api/x').flush(null, { status: 400, statusText: 'Bad Request' });
    await expect(promise).rejects.toBeTruthy();
    backend.verify();
  });

  it('does not retry a non-idempotent POST even on 503', async () => {
    const promise = new Promise((_, reject) =>
      http.post('/api/x', {}).subscribe({ error: reject }),
    );
    backend.expectOne('/api/x').flush(null, { status: 503, statusText: 'Unavailable' });
    await expect(promise).rejects.toBeTruthy();
    backend.verify();
  });

  it('gives up after the capped attempt count', async () => {
    const promise = new Promise((_, reject) => http.get('/api/x').subscribe({ error: reject }));

    for (let attempt = 0; attempt < 3; attempt++) {
      backend.expectOne('/api/x').flush(null, { status: 503, statusText: 'Unavailable' });
      await Promise.resolve();
    }

    await expect(promise).rejects.toBeTruthy();
    backend.verify();
  });
});
```

- [ ] **Step 7: Run the test to verify it fails**

```bash
npx nx test shared-http
```

Expected: FAIL — `retryInterceptor` is not defined.

- [ ] **Step 8: Implement the request-id and retry interceptors**

```ts
// libs/shared/http/src/lib/interceptors/request-id.interceptor.ts
import { HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';

/**
 * Frontend-generated correlation identifier for stitching client logs.
 * DISTINCT from the backend traceId, which is authoritative for support
 * and debugging (spec section 8.4).
 */
export const FRONTEND_REQUEST_ID_HEADER = 'X-Frontend-Request-Id';

export const requestIdInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => next(req.clone({ setHeaders: { [FRONTEND_REQUEST_ID_HEADER]: crypto.randomUUID() } }));
```

```ts
// libs/shared/http/src/lib/interceptors/retry.interceptor.ts
import { HttpErrorResponse, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { retry, timer } from 'rxjs';

const IDEMPOTENT_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const RETRIABLE_STATUSES = new Set([0, 429, 502, 503, 504]);

/** Capped attempts and capped backoff (spec section 8.2). */
const MAX_RETRIES = 2;
const BASE_DELAY_MS = 300;
const MAX_DELAY_MS = 4000;

function retryDelay(error: unknown, retryCount: number) {
  if (error instanceof HttpErrorResponse && error.status === 429) {
    const header = Number(error.headers.get('Retry-After'));
    if (Number.isFinite(header) && header > 0) {
      return timer(Math.min(header * 1000, MAX_DELAY_MS));
    }
  }
  return timer(Math.min(BASE_DELAY_MS * 2 ** (retryCount - 1), MAX_DELAY_MS));
}

/**
 * Retries ONLY transient failures on idempotent requests. Business errors and
 * ordinary 4xx responses are never retried (spec section 8.2).
 */
export const retryInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  if (!IDEMPOTENT_METHODS.has(req.method.toUpperCase())) {
    return next(req);
  }

  return next(req).pipe(
    retry({
      count: MAX_RETRIES,
      delay: (error, retryCount) => {
        const status = error instanceof HttpErrorResponse ? error.status : -1;
        if (!RETRIABLE_STATUSES.has(status)) {
          throw error;
        }
        return retryDelay(error, retryCount);
      },
    }),
  );
};
```

- [ ] **Step 9: Run the test to verify it passes**

```bash
npx nx test shared-http
```

Expected: PASS, all four retry cases.

- [ ] **Step 10: Write the failing test for chain composition**

```ts
// libs/shared/http/src/lib/provide-http-infrastructure.spec.ts
import { HttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { APP_CONFIG } from '@crm/shared/config';
import {
  FRONTEND_REQUEST_ID_HEADER,
  provideHttpInfrastructure,
  SESSION_CREDENTIAL_PROVIDER,
} from '../index';

describe('provideHttpInfrastructure', () => {
  let http: HttpClient;
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: APP_CONFIG,
          useValue: {
            apiBaseUrl: 'http://localhost/api',
            socketUrl: 'ws://localhost/ws',
            enabledChannels: [],
            enabledAiCapabilities: [],
            featureFlagDefaults: {},
          },
        },
        provideHttpInfrastructure(),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  it('stamps a frontend request id on every outbound request', () => {
    http.get('/api/x').subscribe();
    const request = backend.expectOne('/api/x');
    expect(request.request.headers.get(FRONTEND_REQUEST_ID_HEADER)).toMatch(/[0-9a-f-]{36}/);
  });

  it('normalizes a failure into AppError before it reaches the caller', async () => {
    const promise = new Promise((_, reject) => http.get('/api/x').subscribe({ error: reject }));
    backend
      .expectOne('/api/x')
      .flush({ code: 'ticket.not_found', message: 'x', traceId: 't-1' }, { status: 404, statusText: 'NF' });

    await expect(promise).rejects.toMatchObject({
      code: 'ticket.not_found',
      httpStatus: 404,
      traceId: 't-1',
      retriable: false,
    });
  });

  it('defaults the session credential provider to a no-op so http stands alone', () => {
    const provider = TestBed.inject(SESSION_CREDENTIAL_PROVIDER);
    const unchanged = { headers: { keys: () => [] } } as never;
    expect(provider.authorize(unchanged)).toBe(unchanged);
  });
});
```

- [ ] **Step 11: Run the test to verify it fails**

```bash
npx nx test shared-http
```

Expected: FAIL — `provideHttpInfrastructure` is not defined.

- [ ] **Step 12: Implement tokens, the error normalizer, and chain composition**

```ts
// libs/shared/http/src/lib/tokens.ts
import { HttpContext, HttpContextToken, HttpRequest, InjectionToken } from '@angular/common/http';
import { Observable, of } from 'rxjs';

/** Implemented by shared/auth (Task 9). The transport is deliberately unspecified (open question U1). */
export interface SessionCredentialProvider {
  authorize(req: HttpRequest<unknown>): HttpRequest<unknown>;
  reauthenticate(): Observable<boolean>;
}

export const SESSION_CREDENTIAL_PROVIDER = new InjectionToken<SessionCredentialProvider>(
  'SESSION_CREDENTIAL_PROVIDER',
  { providedIn: 'root', factory: () => ({ authorize: (req) => req, reauthenticate: () => of(false) }) },
);

/** Implemented by shared/i18n (Task 8). */
export const LOCALE_PREFERENCE_PROVIDER = new InjectionToken<{ current(): string }>(
  'LOCALE_PREFERENCE_PROVIDER',
  { providedIn: 'root', factory: () => ({ current: () => 'en' }) },
);

export interface ActiveScope {
  readonly departmentId?: string;
  readonly branchId?: string;
}

/** Implemented by shared/permissions (Task 12). */
export const ACTIVE_SCOPE_PROVIDER = new InjectionToken<{ current(): ActiveScope | null }>(
  'ACTIVE_SCOPE_PROVIDER',
  { providedIn: 'root', factory: () => ({ current: () => null }) },
);

/**
 * Active-scope attachment is OPT-IN per request, never global (spec section 8.3).
 * Calls that must not be scope-filtered — GET /me, runtime config, own
 * notifications, global search — simply do not opt in.
 */
export const SCOPE_BOUND = new HttpContextToken<boolean>(() => false);

export function scopeBound(context = new HttpContext()): HttpContext {
  return context.set(SCOPE_BOUND, true);
}
```

```ts
// libs/shared/http/src/lib/interceptors/error-normalizer.interceptor.ts
import { HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { toAppError } from '../app-error';

/** Converts every failure into AppError. Sits OUTSIDE retry, so it sees only final failures. */
export const errorNormalizerInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => next(req).pipe(catchError((error) => throwError(() => toAppError(error))));
```

```ts
// libs/shared/http/src/lib/provide-http-infrastructure.ts
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
```

Create the three token-driven interceptors now as thin readers, so the chain is complete from this task onward and Tasks 8, 9, and 12 only supply implementations:

```ts
// libs/shared/http/src/lib/interceptors/session.interceptor.ts
import { HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { SESSION_CREDENTIAL_PROVIDER } from '../tokens';

/** Named `session`, not `bearer`/`jwt`: the transport is pluggable (open question U1). */
export const sessionInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => next(inject(SESSION_CREDENTIAL_PROVIDER).authorize(req));
```

```ts
// libs/shared/http/src/lib/interceptors/locale.interceptor.ts
import { HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { LOCALE_PREFERENCE_PROVIDER } from '../tokens';

export const localeInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) =>
  next(
    req.clone({ setHeaders: { 'Accept-Language': inject(LOCALE_PREFERENCE_PROVIDER).current() } }),
  );
```

```ts
// libs/shared/http/src/lib/interceptors/scope.interceptor.ts
import { HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { ACTIVE_SCOPE_PROVIDER, SCOPE_BOUND } from '../tokens';

/** Attaches active scope ONLY when the request opted in (spec section 8.3). */
export const scopeInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  if (!req.context.get(SCOPE_BOUND)) {
    return next(req);
  }

  const scope = inject(ACTIVE_SCOPE_PROVIDER).current();
  if (!scope) {
    return next(req);
  }

  let params = req.params;
  if (scope.departmentId) {
    params = params.set('departmentId', scope.departmentId);
  }
  if (scope.branchId) {
    params = params.set('branchId', scope.branchId);
  }
  return next(req.clone({ params }));
};
```

```ts
// libs/shared/http/src/index.ts
export { isAppError, toAppError, type AppError } from './lib/app-error';
export {
  ACTIVE_SCOPE_PROVIDER,
  LOCALE_PREFERENCE_PROVIDER,
  SCOPE_BOUND,
  SESSION_CREDENTIAL_PROVIDER,
  scopeBound,
  type ActiveScope,
  type SessionCredentialProvider,
} from './lib/tokens';
export { FRONTEND_REQUEST_ID_HEADER } from './lib/interceptors/request-id.interceptor';
export { provideHttpInfrastructure } from './lib/provide-http-infrastructure';
```

- [ ] **Step 13: Run the full library test suite**

```bash
npx nx test shared-http
npx nx lint shared-http
```

Expected: PASS.

- [ ] **Step 14: Commit**

```bash
git add -A
git commit -m "feat(http): add typed errors, request identity, and transient-only retry

Establishes AppError as the single normalized error shape, separates the
frontend request id from the backend-authoritative traceId, retries only
transient failures on idempotent requests with capped backoff, and composes the
fixed interceptor chain against tokens that auth, i18n, and permissions fill in
later. Spec sections 8.2-8.4, 10.1."
```

**Completion criteria:** every failure reaching a caller is an `AppError`; a `400` is never retried; a `POST` is never retried; the chain is composed in the spec's fixed order; scope attachment is opt-in and defaults to off.

---

### Task 5: Translation core

**Files:**
- Create: `libs/shared/i18n/src/lib/language.ts`
- Create: `libs/shared/i18n/src/lib/transloco.config.ts`
- Create: `libs/shared/i18n/src/lib/transloco.config.spec.ts`
- Create: `apps/agent-app/public/i18n/en.json`, `ar.json`
- Create: `apps/portal-app/public/i18n/en.json`, `ar.json`
- Create: `libs/shared/i18n/src/index.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `type AppLanguage = 'ar' | 'en'`
  - `const SUPPORTED_LANGUAGES: readonly AppLanguage[]`
  - `const DEFAULT_LANGUAGE: AppLanguage` (`'en'`)
  - `function isAppLanguage(value: unknown): value is AppLanguage`
  - `function provideAppTranslation(): EnvironmentProviders`

- [ ] **Step 1: Generate the library and install Transloco**

```bash
npx nx g @nx/angular:library shared-i18n \
  --directory=libs/shared/i18n \
  --unitTestRunner=vitest --standalone --skipModule \
  --tags=scope:shared,type:util --no-interactive

npm install @jsverse/transloco @jsverse/transloco-messageformat
```

- [ ] **Step 2: Write the failing test**

The load-bearing assertion is ICU: Arabic has six plural categories, so English `one`/`other` logic is wrong there (spec section 9.1).

```ts
// libs/shared/i18n/src/lib/transloco.config.spec.ts
import { TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_LANGUAGE, isAppLanguage, provideAppTranslation, SUPPORTED_LANGUAGES } from '../index';

describe('application translation', () => {
  let transloco: TranslocoService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideAppTranslation()] });
    transloco = TestBed.inject(TranslocoService);
  });

  it('supports exactly Arabic and English', () => {
    expect([...SUPPORTED_LANGUAGES].sort()).toEqual(['ar', 'en']);
    expect(DEFAULT_LANGUAGE).toBe('en');
  });

  it('recognizes supported languages and rejects others', () => {
    expect(isAppLanguage('ar')).toBe(true);
    expect(isAppLanguage('fr')).toBe(false);
    expect(isAppLanguage(undefined)).toBe(false);
  });

  it('resolves the six Arabic plural categories through ICU', () => {
    const message =
      '{count, plural, zero{لا تذاكر} one{تذكرة واحدة} two{تذكرتان} few{# تذاكر} many{# تذكرة} other{# تذكرة}}';
    transloco.setTranslation({ 'tickets.count': message }, 'ar');
    transloco.setActiveLang('ar');

    const render = (count: number) => transloco.translate('tickets.count', { count });

    expect(render(0)).toBe('لا تذاكر');
    expect(render(1)).toBe('تذكرة واحدة');
    expect(render(2)).toBe('تذكرتان');
    expect(render(3)).toBe('3 تذاكر');
    expect(render(11)).toBe('11 تذكرة');
  });

  it('reports a missing key rather than rendering it silently', () => {
    transloco.setActiveLang('en');
    expect(() => transloco.translate('nope.missing.key')).toThrowError(/nope\.missing\.key/);
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

```bash
npx nx test shared-i18n
```

Expected: FAIL — `provideAppTranslation` is not defined.

- [ ] **Step 4: Implement the language type and Transloco configuration**

```ts
// libs/shared/i18n/src/lib/language.ts
export type AppLanguage = 'ar' | 'en';

export const SUPPORTED_LANGUAGES: readonly AppLanguage[] = ['en', 'ar'] as const;
export const DEFAULT_LANGUAGE: AppLanguage = 'en';

/** Languages written right-to-left. Direction is derived from this (spec section 9.3). */
export const RTL_LANGUAGES: ReadonlySet<AppLanguage> = new Set<AppLanguage>(['ar']);

export function isAppLanguage(value: unknown): value is AppLanguage {
  return typeof value === 'string' && (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}
```

```ts
// libs/shared/i18n/src/lib/transloco.config.ts
import { HttpClient } from '@angular/common/http';
import {
  EnvironmentProviders,
  inject,
  Injectable,
  isDevMode,
  makeEnvironmentProviders,
} from '@angular/core';
import {
  provideTransloco,
  Translation,
  TranslocoLoader,
  TranslocoMissingHandler,
} from '@jsverse/transloco';
import { provideTranslocoMessageformat } from '@jsverse/transloco-messageformat';
import { Observable } from 'rxjs';
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from './language';

/**
 * Scopes are aligned one-to-one with feature libraries, so a feature's strings
 * load with its route chunk (spec section 9.1). A scoped file lives at
 * /i18n/<scope>/<lang>.json; a root file at /i18n/<lang>.json.
 */
@Injectable({ providedIn: 'root' })
export class HttpTranslationLoader implements TranslocoLoader {
  private readonly http = inject(HttpClient);

  getTranslation(path: string): Observable<Translation> {
    return this.http.get<Translation>(`/i18n/${path}.json`);
  }
}

/** Missing keys throw in development and fall back to English in production (spec section 9.1). */
@Injectable({ providedIn: 'root' })
export class ReportingMissingHandler implements TranslocoMissingHandler {
  handle(key: string): string {
    if (isDevMode()) {
      throw new Error(`Missing translation key: ${key}`);
    }
    return key;
  }
}

export function provideAppTranslation(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideTransloco({
      config: {
        availableLangs: [...SUPPORTED_LANGUAGES],
        defaultLang: DEFAULT_LANGUAGE,
        fallbackLang: DEFAULT_LANGUAGE,
        reRenderOnLangChange: true,
        missingHandler: { allowEmpty: false, useFallbackTranslation: true },
        prodMode: !isDevMode(),
      },
      loader: HttpTranslationLoader,
    }),
    provideTranslocoMessageformat(),
    { provide: TranslocoMissingHandler, useClass: ReportingMissingHandler },
  ]);
}
```

- [ ] **Step 5: Create the root translation documents**

```json
// apps/agent-app/public/i18n/en.json
{
  "shell": {
    "skipToContent": "Skip to content",
    "language": "Language",
    "scope": "Department and branch",
    "notifications": "Notifications",
    "account": "Account",
    "signOut": "Sign out",
    "reconnecting": "Reconnecting…"
  },
  "errors": {
    "generic": "Something went wrong.",
    "forbidden": "You do not have access to this page.",
    "notFound": "That page does not exist.",
    "offline": "You appear to be offline.",
    "retry": "Try again",
    "copyTraceId": "Copy reference"
  },
  "state": {
    "empty": "Nothing to show",
    "loading": "Loading…"
  }
}
```

```json
// apps/agent-app/public/i18n/ar.json
{
  "shell": {
    "skipToContent": "تخطَّ إلى المحتوى",
    "language": "اللغة",
    "scope": "الإدارة والفرع",
    "notifications": "الإشعارات",
    "account": "الحساب",
    "signOut": "تسجيل الخروج",
    "reconnecting": "جارٍ إعادة الاتصال…"
  },
  "errors": {
    "generic": "حدث خطأ ما.",
    "forbidden": "ليس لديك صلاحية الوصول إلى هذه الصفحة.",
    "notFound": "هذه الصفحة غير موجودة.",
    "offline": "يبدو أنك غير متصل بالإنترنت.",
    "retry": "أعد المحاولة",
    "copyTraceId": "نسخ الرقم المرجعي"
  },
  "state": {
    "empty": "لا يوجد ما يُعرض",
    "loading": "جارٍ التحميل…"
  }
}
```

Copy both documents to `apps/portal-app/public/i18n/`.

- [ ] **Step 6: Run the test to verify it passes**

```bash
npx nx test shared-i18n
```

Expected: PASS, all four cases — in particular the five Arabic plural assertions.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(i18n): add Transloco with ICU pluralization and lazy scopes

Enables MessageFormat from the outset so Arabic's six plural categories are
handled correctly; missing keys throw in development. Spec section 9.1."
```

**Completion criteria:** Arabic renders `zero`, `one`, `two`, `few`, and `many` correctly; a missing key fails loudly in development; scope loading resolves `/i18n/<scope>/<lang>.json`.

---

### Task 6: Locale-aware formatting

`LOCALE_ID` resolves once at injection time and cannot follow a runtime language switch, so formatting goes through `Intl` abstractions driven by a signal (spec section 9.2). This task also establishes the UTC invariant that keeps open question P3 (display timezone policy) safely deferrable.

**Files:**
- Create: `libs/shared/i18n/src/lib/locale-format.service.ts`, `locale-format.service.spec.ts`
- Create: `libs/shared/i18n/src/lib/pipes/locale-date.pipe.ts`
- Create: `libs/shared/i18n/src/lib/pipes/locale-number.pipe.ts`
- Create: `libs/shared/i18n/src/lib/pipes/locale-relative-time.pipe.ts`
- Modify: `libs/shared/i18n/src/index.ts`

**Interfaces:**
- Consumes: `AppLanguage` (Task 5)
- Produces:
  - `class LocaleFormatService` with `date(value: string | Date, options?: Intl.DateTimeFormatOptions): string`, `number(value: number, options?: Intl.NumberFormatOptions): string`, `relativeTime(value: string | Date, now?: Date): string`
  - Pipes `localeDate`, `localeNumber`, `localeRelativeTime` (all `standalone`, all `pure: false` so they re-render on language change)

- [ ] **Step 1: Write the failing test**

```ts
// libs/shared/i18n/src/lib/locale-format.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { LanguageStore } from './language.store';
import { LocaleFormatService } from './locale-format.service';

describe('LocaleFormatService', () => {
  let format: LocaleFormatService;
  let language: LanguageStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    format = TestBed.inject(LocaleFormatService);
    language = TestBed.inject(LanguageStore);
  });

  it('accepts an ISO-8601 UTC timestamp, the API and internal invariant', () => {
    expect(() => format.date('2026-08-24T09:30:00Z')).not.toThrow();
  });

  it('rejects a timestamp without timezone information', () => {
    expect(() => format.date('2026-08-24 09:30:00')).toThrowError(/ISO-8601/);
  });

  it('formats numbers differently per language without re-injection', () => {
    language.setLanguage('en');
    const english = format.number(1234.5);
    language.setLanguage('ar');
    const arabic = format.number(1234.5);

    expect(english).toBe('1,234.5');
    expect(arabic).not.toBe('');
    // Western digits: Arabic-Indic numerals are explicitly NOT a requirement
    // (spec section 2, locale rules), so the digit set must not change.
    expect(arabic).toMatch(/[0-9]/);
  });

  it('follows a runtime language switch for dates', () => {
    language.setLanguage('en');
    const english = format.date('2026-08-24T09:30:00Z', { month: 'long' });
    language.setLanguage('ar');
    const arabic = format.date('2026-08-24T09:30:00Z', { month: 'long' });

    expect(english).not.toBe(arabic);
  });

  it('renders relative time from a fixed reference point', () => {
    language.setLanguage('en');
    const result = format.relativeTime('2026-08-24T09:00:00Z', new Date('2026-08-24T11:00:00Z'));
    expect(result).toMatch(/2 hours ago/);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx nx test shared-i18n
```

Expected: FAIL — `LanguageStore` and `LocaleFormatService` are not defined.

- [ ] **Step 3: Implement the language store**

```ts
// libs/shared/i18n/src/lib/language.store.ts
import { computed, Injectable, signal } from '@angular/core';
import { AppLanguage, DEFAULT_LANGUAGE, RTL_LANGUAGES } from './language';

/**
 * The single reactive source of the active language. Everything that depends on
 * language — formatting, direction, the Accept-Language header — reads this.
 */
@Injectable({ providedIn: 'root' })
export class LanguageStore {
  private readonly active = signal<AppLanguage>(DEFAULT_LANGUAGE);

  readonly language = this.active.asReadonly();
  readonly direction = computed<'rtl' | 'ltr'>(() =>
    RTL_LANGUAGES.has(this.active()) ? 'rtl' : 'ltr',
  );

  setLanguage(language: AppLanguage): void {
    this.active.set(language);
  }
}
```

- [ ] **Step 4: Implement the formatting service**

```ts
// libs/shared/i18n/src/lib/locale-format.service.ts
import { computed, inject, Injectable } from '@angular/core';
import { LanguageStore } from './language.store';

/**
 * Locale-aware formatting driven by a signal, because LOCALE_ID resolves once at
 * injection time and cannot follow a runtime language switch (spec section 9.2).
 *
 * Feature code must use these abstractions for locale-dependent formatting. This
 * is a targeted requirement, not a blanket ban on Angular pipes.
 */
@Injectable({ providedIn: 'root' })
export class LocaleFormatService {
  private readonly languageStore = inject(LanguageStore);

  /**
   * Numbering system is pinned to `latn`: Arabic-Indic numerals are explicitly
   * not a requirement (spec section 2). Revisit only if that changes.
   */
  private readonly locale = computed(() => `${this.languageStore.language()}-u-nu-latn`);

  date(value: string | Date, options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }): string {
    return new Intl.DateTimeFormat(this.locale(), options).format(this.toDate(value));
  }

  number(value: number, options: Intl.NumberFormatOptions = {}): string {
    return new Intl.NumberFormat(this.locale(), options).format(value);
  }

  relativeTime(value: string | Date, now: Date = new Date()): string {
    const deltaSeconds = (this.toDate(value).getTime() - now.getTime()) / 1000;
    const formatter = new Intl.RelativeTimeFormat(this.locale(), { numeric: 'auto' });

    const units: [Intl.RelativeTimeFormatUnit, number][] = [
      ['year', 31_536_000],
      ['month', 2_592_000],
      ['day', 86_400],
      ['hour', 3_600],
      ['minute', 60],
      ['second', 1],
    ];

    for (const [unit, seconds] of units) {
      if (Math.abs(deltaSeconds) >= seconds || unit === 'second') {
        return formatter.format(Math.round(deltaSeconds / seconds), unit);
      }
    }
    return formatter.format(0, 'second');
  }

  /**
   * Timestamps are ISO-8601 UTC at the API boundary and internally
   * (spec section 8.5). Display timezone policy is open question P3; until it is
   * decided, values render in the browser's resolved timezone. No policy is asserted.
   */
  private toDate(value: string | Date): Date {
    if (value instanceof Date) {
      return value;
    }
    if (!/(?:Z|[+-]\d{2}:?\d{2})$/.test(value)) {
      throw new Error(
        `Timestamp "${value}" is not ISO-8601 with timezone information. ` +
          `Timestamps are ISO-8601 UTC at the API boundary (spec section 8.5).`,
      );
    }
    return new Date(value);
  }
}
```

- [ ] **Step 5: Implement the pipes**

```ts
// libs/shared/i18n/src/lib/pipes/locale-date.pipe.ts
import { inject, Pipe, PipeTransform } from '@angular/core';
import { LocaleFormatService } from '../locale-format.service';

@Pipe({ name: 'localeDate', standalone: true, pure: false })
export class LocaleDatePipe implements PipeTransform {
  private readonly format = inject(LocaleFormatService);

  transform(value: string | Date, options?: Intl.DateTimeFormatOptions): string {
    return this.format.date(value, options);
  }
}
```

```ts
// libs/shared/i18n/src/lib/pipes/locale-number.pipe.ts
import { inject, Pipe, PipeTransform } from '@angular/core';
import { LocaleFormatService } from '../locale-format.service';

@Pipe({ name: 'localeNumber', standalone: true, pure: false })
export class LocaleNumberPipe implements PipeTransform {
  private readonly format = inject(LocaleFormatService);

  transform(value: number, options?: Intl.NumberFormatOptions): string {
    return this.format.number(value, options);
  }
}
```

```ts
// libs/shared/i18n/src/lib/pipes/locale-relative-time.pipe.ts
import { inject, Pipe, PipeTransform } from '@angular/core';
import { LocaleFormatService } from '../locale-format.service';

@Pipe({ name: 'localeRelativeTime', standalone: true, pure: false })
export class LocaleRelativeTimePipe implements PipeTransform {
  private readonly format = inject(LocaleFormatService);

  transform(value: string | Date): string {
    return this.format.relativeTime(value);
  }
}
```

- [ ] **Step 6: Run the test to verify it passes**

```bash
npx nx test shared-i18n
```

Expected: PASS, all five cases.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(i18n): add Intl-based locale formatting that follows runtime language

LOCALE_ID cannot follow a runtime switch, so formatting is signal-driven.
Rejects timestamps lacking timezone information, enforcing the ISO-8601 UTC
invariant. Spec sections 8.5, 9.2."
```

**Completion criteria:** formatting changes when the language signal changes, with no re-injection; a timestamp without timezone information is rejected; the digit set stays Western.

---

### Task 7: Direction

**Files:**
- Create: `libs/shared/i18n/src/lib/direction.service.ts`, `direction.service.spec.ts`
- Create: `libs/shared/i18n/src/lib/app-directionality.ts`
- Create: `libs/shared/i18n/src/lib/detect-direction.ts`, `detect-direction.spec.ts`
- Modify: `libs/shared/i18n/src/index.ts`

**Interfaces:**
- Consumes: `LanguageStore` (Task 6)
- Produces:
  - `class DirectionService` — synchronizes `document.documentElement` `lang`/`dir` and the CDK `Directionality`
  - `class AppDirectionality extends Directionality` — provided for `Directionality` so CDK overlays flip
  - `function detectDirection(text: string): 'rtl' | 'ltr'` — first-strong-character detection

- [ ] **Step 1: Write the failing tests**

```ts
// libs/shared/i18n/src/lib/direction.service.spec.ts
import { Directionality } from '@angular/cdk/bidi';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { DirectionService } from './direction.service';
import { LanguageStore } from './language.store';
import { provideAppDirection } from './provide-app-direction';

describe('DirectionService', () => {
  let language: LanguageStore;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideAppDirection()] });
    TestBed.inject(DirectionService).start();
    language = TestBed.inject(LanguageStore);
  });

  it('sets document lang and dir for English', () => {
    language.setLanguage('en');
    TestBed.tick();
    expect(document.documentElement.lang).toBe('en');
    expect(document.documentElement.dir).toBe('ltr');
  });

  it('sets document lang and dir for Arabic', () => {
    language.setLanguage('ar');
    TestBed.tick();
    expect(document.documentElement.lang).toBe('ar');
    expect(document.documentElement.dir).toBe('rtl');
  });

  it('drives the CDK Directionality that overlays and menus read', () => {
    const directionality = TestBed.inject(Directionality);
    language.setLanguage('ar');
    TestBed.tick();
    expect(directionality.value).toBe('rtl');
  });

  it('emits on the CDK change stream so open overlays reposition', () => {
    const directionality = TestBed.inject(Directionality);
    const seen: string[] = [];
    directionality.change.subscribe((dir) => seen.push(dir));

    language.setLanguage('ar');
    TestBed.tick();
    language.setLanguage('en');
    TestBed.tick();

    expect(seen).toEqual(['rtl', 'ltr']);
  });
});
```

```ts
// libs/shared/i18n/src/lib/detect-direction.spec.ts
import { describe, expect, it } from 'vitest';
import { detectDirection } from './detect-direction';

describe('detectDirection', () => {
  it('detects Arabic text as rtl', () => {
    expect(detectDirection('مرحبا، لدي مشكلة في الطلب')).toBe('rtl');
  });

  it('detects English text as ltr', () => {
    expect(detectDirection('Hello, I have an issue with my order')).toBe('ltr');
  });

  it('uses the first strong character, ignoring leading punctuation and digits', () => {
    expect(detectDirection('  "123 — مرحبا')).toBe('rtl');
    expect(detectDirection('  "123 — Hello')).toBe('ltr');
  });

  it('falls back to ltr for text with no strong characters', () => {
    expect(detectDirection('12345 !!! ???')).toBe('ltr');
    expect(detectDirection('')).toBe('ltr');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
npx nx test shared-i18n
```

Expected: FAIL — `DirectionService`, `provideAppDirection`, and `detectDirection` are not defined.

- [ ] **Step 3: Implement the CDK bridge**

```ts
// libs/shared/i18n/src/lib/app-directionality.ts
import { Direction, Directionality } from '@angular/cdk/bidi';
import { Injectable } from '@angular/core';

/**
 * Directionality is what CDK — and therefore PrimeNG's overlays, menus, and
 * dropdowns — reads to decide which way to flip. Extending it keeps direction
 * on a supported API rather than any vendor internal (spec section 9.3).
 */
@Injectable({ providedIn: 'root' })
export class AppDirectionality extends Directionality {
  update(direction: Direction): void {
    if (this.value === direction) {
      return;
    }
    this.value = direction;
    this.change.emit(direction);
  }
}
```

- [ ] **Step 4: Implement the direction service and its provider**

```ts
// libs/shared/i18n/src/lib/direction.service.ts
import { DOCUMENT } from '@angular/common';
import { effect, inject, Injectable, Injector, runInInjectionContext } from '@angular/core';
import { AppDirectionality } from './app-directionality';
import { LanguageStore } from './language.store';

/**
 * The single source of truth for direction (spec section 9.3). Derives direction
 * from the active language and synchronizes:
 *   - the document's lang and dir attributes,
 *   - Angular/CDK direction infrastructure,
 *   - PrimeNG and theme direction behavior, which key off the document dir
 *     attribute — a supported surface, not an internal detail.
 */
@Injectable({ providedIn: 'root' })
export class DirectionService {
  private readonly document = inject(DOCUMENT);
  private readonly languageStore = inject(LanguageStore);
  private readonly directionality = inject(AppDirectionality);
  private readonly injector = inject(Injector);
  private started = false;

  start(): void {
    if (this.started) {
      return;
    }
    this.started = true;

    runInInjectionContext(this.injector, () => {
      effect(() => {
        const language = this.languageStore.language();
        const direction = this.languageStore.direction();

        const root = this.document.documentElement;
        root.setAttribute('lang', language);
        root.setAttribute('dir', direction);

        this.directionality.update(direction);
      });
    });
  }
}
```

```ts
// libs/shared/i18n/src/lib/provide-app-direction.ts
import { Directionality } from '@angular/cdk/bidi';
import {
  EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
  provideAppInitializer,
} from '@angular/core';
import { AppDirectionality } from './app-directionality';
import { DirectionService } from './direction.service';

export function provideAppDirection(): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: Directionality, useExisting: AppDirectionality },
    provideAppInitializer(() => inject(DirectionService).start()),
  ]);
}
```

- [ ] **Step 5: Implement first-strong-character detection**

```ts
// libs/shared/i18n/src/lib/detect-direction.ts
/**
 * First-strong-character detection for USER-GENERATED mixed-language content.
 *
 * Prefer `dir="auto"` in templates; use this only where component logic
 * genuinely needs the computed direction value (spec section 9.3).
 */
const STRONG_RTL = /[֑-߿‏‫‮יִ-﷽ﹰ-ﻼ]/;
const STRONG_LTR = /[A-Za-zÀ-ʸ̀-֐]/;

export function detectDirection(text: string): 'rtl' | 'ltr' {
  for (const character of text) {
    if (STRONG_RTL.test(character)) {
      return 'rtl';
    }
    if (STRONG_LTR.test(character)) {
      return 'ltr';
    }
  }
  return 'ltr';
}
```

- [ ] **Step 6: Run the tests to verify they pass**

```bash
npx nx test shared-i18n
```

Expected: PASS, all eight cases.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(i18n): add DirectionService as the single source of direction

Synchronizes document lang/dir and the CDK Directionality that overlays read,
without depending on any vendor internal. Adds first-strong-character detection
for the cases where computed direction is genuinely needed. Spec section 9.3."
```

**Completion criteria:** switching language flips `document.documentElement.dir`, the CDK `Directionality.value`, and emits on its change stream; direction integration touches no vendor internals; `detectDirection` handles leading punctuation and empty input.

---

### Task 8: Language resolution and the locale interceptor

Implements the resolution order and — the part that is easy to get wrong — the separation between a **device** language preference and an **authenticated user's server** preference (spec section 9.3).

**Files:**
- Create: `libs/shared/i18n/src/lib/language-resolver.service.ts`, `language-resolver.service.spec.ts`
- Create: `libs/shared/i18n/src/lib/provide-locale-preference.ts`
- Modify: `libs/shared/i18n/src/index.ts`

**Interfaces:**
- Consumes: `LanguageStore` (Task 6), `LOCALE_PREFERENCE_PROVIDER` (Task 4)
- Produces:
  - `class LanguageResolver` with `resolveUnauthenticated(): AppLanguage`, `applyServerPreference(language: AppLanguage): void`, `chooseExplicitly(language: AppLanguage): void`, `onSessionEnded(): void`
  - `const DEVICE_LANGUAGE_KEY = 'crm.device.language'`
  - `function provideLocalePreference(): EnvironmentProviders`

- [ ] **Step 1: Write the failing test**

```ts
// libs/shared/i18n/src/lib/language-resolver.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEVICE_LANGUAGE_KEY, LanguageResolver } from './language-resolver.service';
import { LanguageStore } from './language.store';

describe('LanguageResolver', () => {
  let resolver: LanguageResolver;
  let store: LanguageStore;

  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['fr-FR']);
    TestBed.configureTestingModule({});
    resolver = TestBed.inject(LanguageResolver);
    store = TestBed.inject(LanguageStore);
  });

  it('falls back to English when nothing else applies', () => {
    expect(resolver.resolveUnauthenticated()).toBe('en');
  });

  it('prefers the browser language when it is supported', () => {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['ar-SA', 'en-US']);
    expect(resolver.resolveUnauthenticated()).toBe('ar');
  });

  it('prefers the stored device preference over the browser language', () => {
    localStorage.setItem(DEVICE_LANGUAGE_KEY, 'ar');
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['en-US']);
    expect(resolver.resolveUnauthenticated()).toBe('ar');
  });

  it('ignores an unsupported stored value', () => {
    localStorage.setItem(DEVICE_LANGUAGE_KEY, 'de');
    expect(resolver.resolveUnauthenticated()).toBe('en');
  });

  it('lets the server preference win once authenticated', () => {
    localStorage.setItem(DEVICE_LANGUAGE_KEY, 'en');
    resolver.applyServerPreference('ar');
    expect(store.language()).toBe('ar');
  });

  it('does NOT write the server preference to device storage', () => {
    resolver.applyServerPreference('ar');
    expect(localStorage.getItem(DEVICE_LANGUAGE_KEY)).toBeNull();
  });

  it('writes device storage only on an explicit user choice', () => {
    resolver.chooseExplicitly('ar');
    expect(localStorage.getItem(DEVICE_LANGUAGE_KEY)).toBe('ar');
    expect(store.language()).toBe('ar');
  });

  it('reverts to the device preference when the session ends', () => {
    resolver.chooseExplicitly('en');
    resolver.applyServerPreference('ar');
    expect(store.language()).toBe('ar');

    resolver.onSessionEnded();

    // The next user must not inherit the previous user's server preference.
    expect(store.language()).toBe('en');
  });

  it('reverts to the unauthenticated default when no device preference exists', () => {
    resolver.applyServerPreference('ar');
    resolver.onSessionEnded();
    expect(store.language()).toBe('en');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx nx test shared-i18n
```

Expected: FAIL — `LanguageResolver` is not defined.

- [ ] **Step 3: Implement the resolver**

```ts
// libs/shared/i18n/src/lib/language-resolver.service.ts
import { inject, Injectable } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { AppLanguage, DEFAULT_LANGUAGE, isAppLanguage } from './language';
import { LanguageStore } from './language.store';

/**
 * A BROWSER/DEVICE preference, not an identity attribute. It is written only by
 * an explicit user choice, never from a server preference — otherwise one
 * authenticated user's preference would leak into the next user's session on a
 * shared device (spec section 9.3).
 */
export const DEVICE_LANGUAGE_KEY = 'crm.device.language';

@Injectable({ providedIn: 'root' })
export class LanguageResolver {
  private readonly store = inject(LanguageStore);
  private readonly transloco = inject(TranslocoService);

  /** Resolution order before authentication: device storage, browser, English. */
  resolveUnauthenticated(): AppLanguage {
    const stored = this.readDevicePreference();
    if (stored) {
      return stored;
    }

    for (const tag of navigator.languages ?? []) {
      const base = tag.split('-')[0];
      if (isAppLanguage(base)) {
        return base;
      }
    }

    return DEFAULT_LANGUAGE;
  }

  /** Applied in memory only: the server preference never touches device storage. */
  applyServerPreference(language: AppLanguage): void {
    this.activate(language);
  }

  /** An explicit switch updates the device preference and the active language. */
  chooseExplicitly(language: AppLanguage): void {
    localStorage.setItem(DEVICE_LANGUAGE_KEY, language);
    this.activate(language);
  }

  /**
   * On logout or user switch, drop the server preference and fall back to the
   * device preference, so the next user does not inherit the previous user's.
   */
  onSessionEnded(): void {
    this.activate(this.resolveUnauthenticated());
  }

  /** Applies the pre-authentication default. Does not write device storage. */
  applyUnauthenticatedDefault(): void {
    this.activate(this.resolveUnauthenticated());
  }

  private activate(language: AppLanguage): void {
    this.store.setLanguage(language);
    this.transloco.setActiveLang(language);
  }

  private readDevicePreference(): AppLanguage | null {
    const stored = localStorage.getItem(DEVICE_LANGUAGE_KEY);
    return isAppLanguage(stored) ? stored : null;
  }
}
```

- [ ] **Step 4: Implement the locale preference provider**

```ts
// libs/shared/i18n/src/lib/provide-locale-preference.ts
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
```

- [ ] **Step 5: Run the test to verify it passes**

```bash
npx nx test shared-i18n
```

Expected: PASS, all nine cases — in particular the two that prove a server preference never reaches device storage and never survives logout.

- [ ] **Step 6: Add an integration test for the Accept-Language header**

```ts
// libs/shared/i18n/src/lib/provide-locale-preference.spec.ts
import { HttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { APP_CONFIG } from '@crm/shared/config';
import { provideHttpInfrastructure } from '@crm/shared/http';
import { LanguageStore } from './language.store';
import { provideLocalePreference } from './provide-locale-preference';

describe('locale interceptor', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: APP_CONFIG,
          useValue: {
            apiBaseUrl: 'http://localhost/api',
            socketUrl: 'ws://localhost/ws',
            enabledChannels: [],
            enabledAiCapabilities: [],
            featureFlagDefaults: {},
          },
        },
        provideHttpInfrastructure(),
        provideLocalePreference(),
        provideHttpClientTesting(),
      ],
    });
  });

  it('sends the active language as Accept-Language', () => {
    TestBed.inject(LanguageStore).setLanguage('ar');
    TestBed.inject(HttpClient).get('/api/x').subscribe();

    const request = TestBed.inject(HttpTestingController).expectOne('/api/x');
    expect(request.request.headers.get('Accept-Language')).toBe('ar');
  });
});
```

Run `npx nx test shared-i18n`. Expected: PASS.

- [ ] **Step 7: Write the library barrel**

Tasks 5 through 8 all extended this library. Write its complete public surface now, so consumers in Tasks 9, 16, 17, and 18 import from one place:

```ts
// libs/shared/i18n/src/index.ts
export {
  DEFAULT_LANGUAGE,
  isAppLanguage,
  RTL_LANGUAGES,
  SUPPORTED_LANGUAGES,
  type AppLanguage,
} from './lib/language';
export { provideAppTranslation } from './lib/transloco.config';
export { LanguageStore } from './lib/language.store';
export { LocaleFormatService } from './lib/locale-format.service';
export { LocaleDatePipe } from './lib/pipes/locale-date.pipe';
export { LocaleNumberPipe } from './lib/pipes/locale-number.pipe';
export { LocaleRelativeTimePipe } from './lib/pipes/locale-relative-time.pipe';
export { AppDirectionality } from './lib/app-directionality';
export { DirectionService } from './lib/direction.service';
export { provideAppDirection } from './lib/provide-app-direction';
export { detectDirection } from './lib/detect-direction';
export { DEVICE_LANGUAGE_KEY, LanguageResolver } from './lib/language-resolver.service';
export { provideLocalePreference } from './lib/provide-locale-preference';
```

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(i18n): add language resolution with device/server preference separation

Resolution order is server preference, device storage, browser, English. The
server preference is applied in memory only and is dropped when the session
ends, so one user's preference cannot leak into the next user's session on a
shared device. Spec section 9.3."
```

**Completion criteria:** the resolution order holds; a server preference never writes to `localStorage`; logout reverts to the device preference; `Accept-Language` follows the active language signal.

---

### Task 9: Session abstraction

The authentication mechanism is undecided (open question U1). This task ships the seam, not a decision: a `SessionStrategy` interface, a development implementation, and the wiring into the `session` interceptor. No transport is assumed.

**Files:**
- Create: `libs/shared/auth/src/lib/session-strategy.ts`
- Create: `libs/shared/auth/src/lib/dev-session.strategy.ts`, `dev-session.strategy.spec.ts`
- Create: `libs/shared/auth/src/lib/session.store.ts`
- Create: `libs/shared/auth/src/lib/authenticated.guard.ts`, `authenticated.guard.spec.ts`
- Create: `libs/shared/auth/src/lib/provide-session.ts`
- Create: `libs/shared/auth/src/index.ts`

**Interfaces:**
- Consumes: `SESSION_CREDENTIAL_PROVIDER` (Task 4), `Identity` shape (Task 3), `LanguageResolver` (Task 8)
- Produces:
  - `interface Identity { userId: string; displayName: string; language: AppLanguage; permissions: PermissionGrant[]; departments: OrgUnitRef[]; branches: OrgUnitRef[]; }`
  - `interface SessionStrategy { initialize(): Promise<void>; login(): Promise<void>; logout(): Promise<void>; authorize(req: HttpRequest<unknown>): HttpRequest<unknown>; reauthenticate(): Observable<boolean>; }`
  - `const SESSION_STRATEGY: InjectionToken<SessionStrategy>`
  - `class SessionStore` with `identity: Signal<Identity | null>`, `status: Signal<'unknown' | 'authenticated' | 'anonymous'>`
  - `const authenticatedGuard: CanMatchFn`
  - `function provideSession(strategy: Type<SessionStrategy>): EnvironmentProviders`

- [ ] **Step 1: Generate the library**

```bash
npx nx g @nx/angular:library shared-auth \
  --directory=libs/shared/auth \
  --unitTestRunner=vitest --standalone --skipModule \
  --tags=scope:shared,type:util --no-interactive
```

- [ ] **Step 2: Write the failing tests**

```ts
// libs/shared/auth/src/lib/dev-session.strategy.spec.ts
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { PROVISIONAL_IDENTITY } from '@crm/shared/testing';
import { DevSessionStrategy } from './dev-session.strategy';
import { SessionStore } from './session.store';

describe('DevSessionStrategy', () => {
  let strategy: DevSessionStrategy;
  let store: SessionStore;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), DevSessionStrategy] });
    strategy = TestBed.inject(DevSessionStrategy);
    store = TestBed.inject(SessionStore);
  });

  it('starts in an unknown state before initialization', () => {
    expect(store.status()).toBe('unknown');
    expect(store.identity()).toBeNull();
  });

  it('loads identity from GET /me during initialization', async () => {
    await strategy.initialize();
    expect(store.status()).toBe('authenticated');
    expect(store.identity()?.userId).toBe(PROVISIONAL_IDENTITY.userId);
  });

  it('leaves the request untouched: no transport is assumed', async () => {
    await strategy.initialize();
    const request = { headers: {} } as never;
    expect(strategy.authorize(request)).toBe(request);
  });

  it('clears identity on logout', async () => {
    await strategy.initialize();
    await strategy.logout();
    expect(store.status()).toBe('anonymous');
    expect(store.identity()).toBeNull();
  });
});
```

```ts
// libs/shared/auth/src/lib/authenticated.guard.spec.ts
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authenticatedGuard } from './authenticated.guard';
import { SessionStore } from './session.store';

describe('authenticatedGuard', () => {
  let store: SessionStore;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: Router, useValue: { createUrlTree: vi.fn(() => 'LOGIN_TREE') } }],
    });
    store = TestBed.inject(SessionStore);
    router = TestBed.inject(Router);
  });

  it('allows an authenticated principal through', () => {
    store.setIdentity({
      userId: 'u1',
      displayName: 'A',
      language: 'en',
      permissions: [],
      departments: [],
      branches: [],
    });
    expect(TestBed.runInInjectionContext(() => authenticatedGuard())).toBe(true);
  });

  it('redirects an anonymous principal to login, preserving the intended route', () => {
    store.setAnonymous();
    const result = TestBed.runInInjectionContext(() => authenticatedGuard());
    expect(result).toBe('LOGIN_TREE');
    expect(router.createUrlTree).toHaveBeenCalledWith(['/auth/login'], expect.anything());
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

```bash
npx nx test shared-auth
```

Expected: FAIL — none of the symbols exist.

- [ ] **Step 4: Implement the session contract and store**

```ts
// libs/shared/auth/src/lib/session-strategy.ts
import { HttpRequest } from '@angular/common/http';
import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { AppLanguage } from '@crm/shared/i18n';

/** PROVISIONAL scope vocabulary — open question P1. */
export type ScopeLevel = 'own' | 'team' | 'department' | 'branch' | 'all';

export interface PermissionGrant {
  readonly permission: string;
  readonly scope: ScopeLevel;
}

export interface OrgUnitRef {
  readonly id: string;
  readonly name: string;
}

/** Mirrors the `Identity` schema in the canonical contract (Task 3). */
export interface Identity {
  readonly userId: string;
  readonly displayName: string;
  readonly language: AppLanguage;
  readonly permissions: readonly PermissionGrant[];
  readonly departments: readonly OrgUnitRef[];
  readonly branches: readonly OrgUnitRef[];
}

/**
 * The authentication mechanism is deliberately unspecified (open question U1).
 * A strategy decides how credentials are acquired, attached, and refreshed;
 * nothing else in the application knows.
 */
export interface SessionStrategy {
  initialize(): Promise<void>;
  login(): Promise<void>;
  logout(): Promise<void>;
  authorize(req: HttpRequest<unknown>): HttpRequest<unknown>;
  reauthenticate(): Observable<boolean>;
}

export const SESSION_STRATEGY = new InjectionToken<SessionStrategy>('SESSION_STRATEGY');
```

```ts
// libs/shared/auth/src/lib/session.store.ts
import { computed, Injectable, signal } from '@angular/core';
import { Identity } from './session-strategy';

export type SessionStatus = 'unknown' | 'authenticated' | 'anonymous';

@Injectable({ providedIn: 'root' })
export class SessionStore {
  private readonly current = signal<Identity | null>(null);
  private readonly resolved = signal(false);

  readonly identity = this.current.asReadonly();
  readonly status = computed<SessionStatus>(() => {
    if (!this.resolved()) {
      return 'unknown';
    }
    return this.current() ? 'authenticated' : 'anonymous';
  });

  setIdentity(identity: Identity): void {
    this.current.set(identity);
    this.resolved.set(true);
  }

  setAnonymous(): void {
    this.current.set(null);
    this.resolved.set(true);
  }
}
```

- [ ] **Step 5: Implement the development strategy and the guard**

```ts
// libs/shared/auth/src/lib/dev-session.strategy.ts
import { HttpClient, HttpRequest } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom, Observable, of } from 'rxjs';
import { LanguageResolver } from '@crm/shared/i18n';
import { Identity, SessionStrategy } from './session-strategy';
import { SessionStore } from './session.store';

/**
 * Development implementation. Reads identity from GET /me and attaches nothing:
 * the real credential transport is open question U1 and arrives with the
 * production strategy that replaces this one.
 */
@Injectable()
export class DevSessionStrategy implements SessionStrategy {
  private readonly http = inject(HttpClient);
  private readonly store = inject(SessionStore);
  private readonly language = inject(LanguageResolver);

  async initialize(): Promise<void> {
    try {
      const identity = await firstValueFrom(this.http.get<Identity>('/api/me'));
      this.store.setIdentity(identity);
      // The server preference wins once authenticated (spec section 9.3).
      this.language.applyServerPreference(identity.language);
    } catch {
      this.store.setAnonymous();
    }
  }

  async login(): Promise<void> {
    await this.initialize();
  }

  async logout(): Promise<void> {
    this.store.setAnonymous();
    // Drop the server preference so it cannot leak into the next session.
    this.language.onSessionEnded();
  }

  authorize(req: HttpRequest<unknown>): HttpRequest<unknown> {
    return req;
  }

  reauthenticate(): Observable<boolean> {
    return of(false);
  }
}
```

```ts
// libs/shared/auth/src/lib/authenticated.guard.ts
import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { SessionStore } from './session.store';

export const authenticatedGuard: CanMatchFn = (_route, segments) => {
  const store = inject(SessionStore);
  const router = inject(Router);

  if (store.status() === 'authenticated') {
    return true;
  }

  const intended = '/' + segments.map((segment) => segment.path).join('/');
  return router.createUrlTree(['/auth/login'], { queryParams: { returnTo: intended } });
};
```

```ts
// libs/shared/auth/src/lib/provide-session.ts
import {
  EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
  provideAppInitializer,
  Type,
} from '@angular/core';
import { SESSION_CREDENTIAL_PROVIDER } from '@crm/shared/http';
import { SESSION_STRATEGY, SessionStrategy } from './session-strategy';

export function provideSession(strategy: Type<SessionStrategy>): EnvironmentProviders {
  return makeEnvironmentProviders([
    strategy,
    { provide: SESSION_STRATEGY, useExisting: strategy },
    {
      provide: SESSION_CREDENTIAL_PROVIDER,
      useFactory: () => {
        const active = inject(SESSION_STRATEGY);
        return {
          authorize: (req) => active.authorize(req),
          reauthenticate: () => active.reauthenticate(),
        };
      },
    },
    provideAppInitializer(() => inject(SESSION_STRATEGY).initialize()),
  ]);
}
```

- [ ] **Step 6: Run the tests to verify they pass**

```bash
npx nx test shared-auth
```

Expected: PASS, all six cases.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(auth): add pluggable session abstraction with a development strategy

The authentication mechanism stays undecided (open question U1): a strategy owns
credential acquisition, attachment, and refresh, and nothing else knows. Logout
drops the server language preference. Spec sections 8.2, 9.3."
```

**Completion criteria:** identity loads before bootstrap completes; the guard redirects anonymously while preserving the intended route; no credential transport is assumed anywhere; swapping the strategy requires no change outside `provideSession`.

---

### Task 10: Permission engine and route guard

Built against **provisional fixtures** (open question P1). Frontend checks are UX only; the backend remains authoritative (spec section 6.1).

**Files:**
- Create: `libs/shared/permissions/src/lib/permissions.service.ts`, `permissions.service.spec.ts`
- Create: `libs/shared/permissions/src/lib/require-permission.guard.ts`, `require-permission.guard.spec.ts`
- Create: `libs/shared/permissions/src/index.ts`

**Interfaces:**
- Consumes: `SessionStore`, `PermissionGrant`, `ScopeLevel` (Task 9)
- Produces:
  - `class PermissionsService` with `has(permission: string): boolean`, `scopeOf(permission: string): ScopeLevel | null`, `hasAtLeast(permission: string, minimum: ScopeLevel): boolean`
  - `function requirePermission(permission: string): CanMatchFn`

- [ ] **Step 1: Generate the library**

```bash
npx nx g @nx/angular:library shared-permissions \
  --directory=libs/shared/permissions \
  --unitTestRunner=vitest --standalone --skipModule \
  --tags=scope:shared,type:util --no-interactive
```

- [ ] **Step 2: Write the failing tests**

```ts
// libs/shared/permissions/src/lib/permissions.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { SessionStore } from '@crm/shared/auth';
import { PermissionsService } from './permissions.service';

describe('PermissionsService', () => {
  let permissions: PermissionsService;
  let session: SessionStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    permissions = TestBed.inject(PermissionsService);
    session = TestBed.inject(SessionStore);
    session.setIdentity({
      userId: 'u1',
      displayName: 'A',
      language: 'en',
      permissions: [
        { permission: 'ticket.view', scope: 'department' },
        { permission: 'ticket.assign', scope: 'own' },
        { permission: 'report.view', scope: 'all' },
      ],
      departments: [],
      branches: [],
    });
  });

  it('grants a held permission', () => {
    expect(permissions.has('ticket.view')).toBe(true);
  });

  it('denies a permission that is not held', () => {
    expect(permissions.has('sla.manage')).toBe(false);
  });

  it('denies every permission when nobody is authenticated', () => {
    session.setAnonymous();
    expect(permissions.has('ticket.view')).toBe(false);
  });

  it('reports the scope attached to a grant', () => {
    expect(permissions.scopeOf('ticket.view')).toBe('department');
    expect(permissions.scopeOf('sla.manage')).toBeNull();
  });

  it('orders scopes from narrowest to widest', () => {
    expect(permissions.hasAtLeast('ticket.view', 'own')).toBe(true);
    expect(permissions.hasAtLeast('ticket.view', 'department')).toBe(true);
    expect(permissions.hasAtLeast('ticket.view', 'all')).toBe(false);
    expect(permissions.hasAtLeast('report.view', 'all')).toBe(true);
  });

  it('recomputes when identity changes', () => {
    expect(permissions.has('kb.author')).toBe(false);
    session.setIdentity({
      userId: 'u1',
      displayName: 'A',
      language: 'en',
      permissions: [{ permission: 'kb.author', scope: 'all' }],
      departments: [],
      branches: [],
    });
    expect(permissions.has('kb.author')).toBe(true);
  });
});
```

```ts
// libs/shared/permissions/src/lib/require-permission.guard.spec.ts
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SessionStore } from '@crm/shared/auth';
import { requirePermission } from './require-permission.guard';

describe('requirePermission', () => {
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: Router, useValue: { createUrlTree: vi.fn(() => 'FORBIDDEN_TREE') } }],
    });
    router = TestBed.inject(Router);
    TestBed.inject(SessionStore).setIdentity({
      userId: 'u1',
      displayName: 'A',
      language: 'en',
      permissions: [{ permission: 'ticket.view', scope: 'department' }],
      departments: [],
      branches: [],
    });
  });

  it('matches the route when the permission is held', () => {
    const guard = requirePermission('ticket.view');
    expect(TestBed.runInInjectionContext(() => guard({} as never, []))).toBe(true);
  });

  it('routes to /403 rather than redirecting silently', () => {
    const guard = requirePermission('sla.manage');
    const result = TestBed.runInInjectionContext(() => guard({} as never, []));
    expect(result).toBe('FORBIDDEN_TREE');
    expect(router.createUrlTree).toHaveBeenCalledWith(['/403']);
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

```bash
npx nx test shared-permissions
```

Expected: FAIL — `PermissionsService` and `requirePermission` are not defined.

- [ ] **Step 4: Implement the engine and the guard**

```ts
// libs/shared/permissions/src/lib/permissions.service.ts
import { computed, inject, Injectable } from '@angular/core';
import { ScopeLevel, SessionStore } from '@crm/shared/auth';

/**
 * PROVISIONAL ordering, narrowest to widest (open question P1). The real scope
 * vocabulary must be confirmed before permission-sensitive domain work.
 */
const SCOPE_ORDER: readonly ScopeLevel[] = ['own', 'team', 'department', 'branch', 'all'];

/**
 * Frontend permission checks exist to produce a coherent experience — hiding
 * unreachable navigation, avoiding pointless requests, explaining denial.
 * They are NOT a security boundary. The backend is authoritative and must
 * enforce authorization independently (spec section 6.1).
 */
@Injectable({ providedIn: 'root' })
export class PermissionsService {
  private readonly session = inject(SessionStore);

  private readonly grants = computed(() => {
    const identity = this.session.identity();
    const map = new Map<string, ScopeLevel>();
    for (const grant of identity?.permissions ?? []) {
      map.set(grant.permission, grant.scope);
    }
    return map;
  });

  has(permission: string): boolean {
    return this.grants().has(permission);
  }

  scopeOf(permission: string): ScopeLevel | null {
    return this.grants().get(permission) ?? null;
  }

  hasAtLeast(permission: string, minimum: ScopeLevel): boolean {
    const held = this.scopeOf(permission);
    if (!held) {
      return false;
    }
    return SCOPE_ORDER.indexOf(held) >= SCOPE_ORDER.indexOf(minimum);
  }
}
```

```ts
// libs/shared/permissions/src/lib/require-permission.guard.ts
import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { PermissionsService } from './permissions.service';

/**
 * canMatch, deliberately not canActivate: an unauthorized user never downloads
 * the lazy chunk. Denial routes to /403 — silent redirects make permission
 * misconfiguration invisible (spec section 6.3).
 */
export function requirePermission(permission: string): CanMatchFn {
  return () => {
    if (inject(PermissionsService).has(permission)) {
      return true;
    }
    return inject(Router).createUrlTree(['/403']);
  };
}
```

- [ ] **Step 5: Run the tests to verify they pass**

```bash
npx nx test shared-permissions
```

Expected: PASS, all eight cases.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(permissions): add permission engine and canMatch route guard

Uses canMatch so unauthorized users never download the lazy chunk, and routes
denial to /403 rather than redirecting silently. Frontend checks are UX only;
the backend stays authoritative. Provisional catalogue per open question P1.
Spec sections 6.1-6.3."
```

**Completion criteria:** permissions recompute reactively from identity; an unheld permission routes to `/403`; the UX-only nature is documented in the code; the provisional catalogue is labelled.

---

### Task 11: Permission UI surfaces

**Files:**
- Create: `libs/shared/permissions/src/lib/has-permission.directive.ts`, `has-permission.directive.spec.ts`
- Create: `libs/shared/permissions/src/lib/navigation.ts`
- Create: `libs/shared/permissions/src/lib/navigation.service.ts`, `navigation.service.spec.ts`
- Modify: `libs/shared/permissions/src/index.ts`

**Interfaces:**
- Consumes: `PermissionsService` (Task 10)
- Produces:
  - `class HasPermissionDirective` — selector `[appHasPermission]`
  - `interface NavItem { id: string; labelKey: string; route: string; icon: string; permission?: string; children?: NavItem[]; }`
  - `class NavigationService` with `setManifest(items: NavItem[]): void` and `visible: Signal<NavItem[]>`

- [ ] **Step 1: Write the failing tests**

```ts
// libs/shared/permissions/src/lib/has-permission.directive.spec.ts
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { SessionStore } from '@crm/shared/auth';
import { HasPermissionDirective } from './has-permission.directive';

@Component({
  standalone: true,
  imports: [HasPermissionDirective],
  template: `<button *appHasPermission="'ticket.assign'" data-testid="assign">Assign</button>`,
})
class HostComponent {}

describe('HasPermissionDirective', () => {
  let session: SessionStore;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostComponent] });
    session = TestBed.inject(SessionStore);
  });

  const render = () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  it('renders the element when the permission is held', () => {
    session.setIdentity({
      userId: 'u1', displayName: 'A', language: 'en',
      permissions: [{ permission: 'ticket.assign', scope: 'own' }],
      departments: [], branches: [],
    });
    expect(render().querySelector('[data-testid="assign"]')).not.toBeNull();
  });

  it('removes the element from the DOM when the permission is absent', () => {
    session.setAnonymous();
    expect(render().querySelector('[data-testid="assign"]')).toBeNull();
  });
});
```

```ts
// libs/shared/permissions/src/lib/navigation.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { SessionStore } from '@crm/shared/auth';
import { NavigationService } from './navigation.service';
import type { NavItem } from './navigation';

const MANIFEST: NavItem[] = [
  { id: 'dashboard', labelKey: 'nav.dashboard', route: '/dashboard', icon: 'home', permission: 'dashboard.view' },
  { id: 'tickets', labelKey: 'nav.tickets', route: '/tickets', icon: 'inbox', permission: 'ticket.view' },
  {
    id: 'admin', labelKey: 'nav.admin', route: '/admin', icon: 'cog',
    children: [
      { id: 'users', labelKey: 'nav.users', route: '/admin/users', icon: 'user', permission: 'user.manage' },
      { id: 'roles', labelKey: 'nav.roles', route: '/admin/roles', icon: 'key', permission: 'role.manage' },
    ],
  },
  { id: 'notifications', labelKey: 'nav.notifications', route: '/notifications', icon: 'bell' },
];

describe('NavigationService', () => {
  let navigation: NavigationService;
  let session: SessionStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    navigation = TestBed.inject(NavigationService);
    session = TestBed.inject(SessionStore);
    navigation.setManifest(MANIFEST);
  });

  const authorize = (...permissions: string[]) =>
    session.setIdentity({
      userId: 'u1', displayName: 'A', language: 'en',
      permissions: permissions.map((permission) => ({ permission, scope: 'all' as const })),
      departments: [], branches: [],
    });

  it('shows only items whose permission is held', () => {
    authorize('ticket.view');
    expect(navigation.visible().map((item) => item.id)).toEqual(['tickets', 'notifications']);
  });

  it('keeps items that require no permission', () => {
    session.setAnonymous();
    expect(navigation.visible().map((item) => item.id)).toEqual(['notifications']);
  });

  it('filters children and drops a parent left with none', () => {
    authorize('user.manage');
    const admin = navigation.visible().find((item) => item.id === 'admin');
    expect(admin?.children?.map((child) => child.id)).toEqual(['users']);

    authorize('ticket.view');
    expect(navigation.visible().find((item) => item.id === 'admin')).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
npx nx test shared-permissions
```

Expected: FAIL — the directive, `NavItem`, and `NavigationService` are not defined.

- [ ] **Step 3: Implement the directive**

```ts
// libs/shared/permissions/src/lib/has-permission.directive.ts
import {
  Directive,
  effect,
  inject,
  input,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';
import { PermissionsService } from './permissions.service';

/**
 * Third enforcement surface: action UI (spec section 6.3). Removes the element
 * from the DOM rather than hiding it visually.
 *
 * Placed here, not in shared/ui, so the design-system library does not depend on
 * the permission engine — see the plan's placement note.
 */
@Directive({ selector: '[appHasPermission]', standalone: true })
export class HasPermissionDirective {
  private readonly permissions = inject(PermissionsService);
  private readonly template = inject(TemplateRef<unknown>);
  private readonly container = inject(ViewContainerRef);

  readonly appHasPermission = input.required<string>();

  constructor() {
    effect(() => {
      const allowed = this.permissions.has(this.appHasPermission());
      this.container.clear();
      if (allowed) {
        this.container.createEmbeddedView(this.template);
      }
    });
  }
}
```

- [ ] **Step 4: Implement the navigation manifest and service**

```ts
// libs/shared/permissions/src/lib/navigation.ts
/**
 * The sidebar is built from this manifest and filtered through the same
 * PermissionsService the route guards use, so a menu entry can never appear
 * without its route being reachable (spec section 6.3).
 */
export interface NavItem {
  readonly id: string;
  readonly labelKey: string;
  readonly route: string;
  readonly icon: string;
  /** Omit for own-data destinations such as /notifications. */
  readonly permission?: string;
  readonly children?: readonly NavItem[];
}
```

```ts
// libs/shared/permissions/src/lib/navigation.service.ts
import { computed, inject, Injectable, signal } from '@angular/core';
import type { NavItem } from './navigation';
import { PermissionsService } from './permissions.service';

@Injectable({ providedIn: 'root' })
export class NavigationService {
  private readonly permissions = inject(PermissionsService);
  private readonly manifest = signal<readonly NavItem[]>([]);

  readonly visible = computed(() => this.filter(this.manifest()));

  setManifest(items: readonly NavItem[]): void {
    this.manifest.set(items);
  }

  private filter(items: readonly NavItem[]): NavItem[] {
    const result: NavItem[] = [];

    for (const item of items) {
      if (item.permission && !this.permissions.has(item.permission)) {
        continue;
      }

      if (item.children?.length) {
        const children = this.filter(item.children);
        // A parent whose children are all filtered away is itself unreachable.
        if (children.length === 0) {
          continue;
        }
        result.push({ ...item, children });
        continue;
      }

      result.push(item);
    }

    return result;
  }
}
```

- [ ] **Step 5: Run the tests to verify they pass**

```bash
npx nx test shared-permissions
```

Expected: PASS, all five cases.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(permissions): add permission directive and filtered navigation manifest

Completes the navigation and action-UI enforcement surfaces. A parent nav item
whose children are all filtered away is dropped, so no menu entry can point at
an unreachable route. Spec section 6.3."
```

**Completion criteria:** the directive removes rather than hides; the manifest filters recursively; a parent with no visible children disappears; own-data destinations need no permission.

---

### Task 12: Scope context and scope policy

**Blocked by B1** (department and branch relationship). Do not start until the user has stated whether a branch sits inside a department, a department inside a branch, or the two are orthogonal, and whether a user may belong to several of each. The interface below assumes **orthogonal dimensions with multi-membership** purely as a placeholder; if B1 resolves differently, change `ActiveScope` and this service before implementing, and do not treat the placeholder as an answer.

**Files:**
- Create: `libs/shared/permissions/src/lib/scope-context.service.ts`, `scope-context.service.spec.ts`
- Create: `libs/shared/permissions/src/lib/provide-active-scope.ts`
- Modify: `libs/shared/permissions/src/index.ts`

**Interfaces:**
- Consumes: `SessionStore` (Task 9), `ACTIVE_SCOPE_PROVIDER`, `SCOPE_BOUND`, `scopeBound` (Task 4)
- Produces:
  - `class ScopeContextService` with `departments: Signal<OrgUnitRef[]>`, `branches: Signal<OrgUnitRef[]>`, `active: Signal<ActiveScope | null>`, `setDepartment(id: string | null): void`, `setBranch(id: string | null): void`
  - `function provideActiveScope(): EnvironmentProviders`

- [ ] **Step 1: Write the failing tests**

```ts
// libs/shared/permissions/src/lib/scope-context.service.spec.ts
import { HttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { APP_CONFIG } from '@crm/shared/config';
import { provideHttpInfrastructure, scopeBound } from '@crm/shared/http';
import { SessionStore } from '@crm/shared/auth';
import { provideActiveScope } from './provide-active-scope';
import { ScopeContextService } from './scope-context.service';

describe('ScopeContextService', () => {
  let scope: ScopeContextService;
  let session: SessionStore;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: APP_CONFIG,
          useValue: {
            apiBaseUrl: 'http://localhost/api', socketUrl: 'ws://localhost/ws',
            enabledChannels: [], enabledAiCapabilities: [], featureFlagDefaults: {},
          },
        },
        provideHttpInfrastructure(),
        provideActiveScope(),
        provideHttpClientTesting(),
      ],
    });
    scope = TestBed.inject(ScopeContextService);
    session = TestBed.inject(SessionStore);
    session.setIdentity({
      userId: 'u1', displayName: 'A', language: 'en', permissions: [],
      departments: [{ id: 'd1', name: 'Support' }, { id: 'd2', name: 'Billing' }],
      branches: [{ id: 'b1', name: 'Riyadh' }],
    });
  });

  it('exposes the memberships from identity', () => {
    expect(scope.departments().map((d) => d.id)).toEqual(['d1', 'd2']);
    expect(scope.branches().map((b) => b.id)).toEqual(['b1']);
  });

  it('selects the sole membership automatically and leaves a choice unmade', () => {
    expect(scope.active()?.branchId).toBe('b1');
    expect(scope.active()?.departmentId).toBeUndefined();
  });

  it('persists an explicit selection per user', () => {
    scope.setDepartment('d2');
    expect(localStorage.getItem('crm.scope.u1')).toContain('d2');
  });

  it('does NOT attach scope to a request that did not opt in', () => {
    scope.setDepartment('d2');
    TestBed.inject(HttpClient).get('/api/me').subscribe();
    const request = TestBed.inject(HttpTestingController).expectOne((r) => r.url === '/api/me');
    expect(request.request.params.get('departmentId')).toBeNull();
  });

  it('attaches scope to a request that opted in', () => {
    scope.setDepartment('d2');
    TestBed.inject(HttpClient).get('/api/things', { context: scopeBound() }).subscribe();
    const request = TestBed.inject(HttpTestingController).expectOne((r) => r.url === '/api/things');
    expect(request.request.params.get('departmentId')).toBe('d2');
    expect(request.request.params.get('branchId')).toBe('b1');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
npx nx test shared-permissions
```

Expected: FAIL — `ScopeContextService` is not defined.

- [ ] **Step 3: Implement the scope context**

```ts
// libs/shared/permissions/src/lib/scope-context.service.ts
import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { SessionStore } from '@crm/shared/auth';
import type { ActiveScope } from '@crm/shared/http';

interface StoredSelection {
  departmentId?: string;
  branchId?: string;
}

/**
 * Holds the ACTIVE department and branch, surfaced as a switcher in the shell
 * and persisted per user (spec section 6.4).
 *
 * PLACEHOLDER MODEL pending open question B1: departments and branches are
 * treated as orthogonal dimensions with multi-membership. If B1 resolves to a
 * nested relationship, this shape and ActiveScope must change.
 */
@Injectable({ providedIn: 'root' })
export class ScopeContextService {
  private readonly session = inject(SessionStore);
  private readonly selection = signal<StoredSelection>({});

  readonly departments = computed(() => [...(this.session.identity()?.departments ?? [])]);
  readonly branches = computed(() => [...(this.session.identity()?.branches ?? [])]);

  readonly active = computed<ActiveScope | null>(() => {
    const identity = this.session.identity();
    if (!identity) {
      return null;
    }

    const chosen = this.selection();
    // A sole membership needs no choice; several memberships leave it unmade
    // until the user selects, so nothing is silently assumed on their behalf.
    const departmentId =
      chosen.departmentId ?? (this.departments().length === 1 ? this.departments()[0].id : undefined);
    const branchId =
      chosen.branchId ?? (this.branches().length === 1 ? this.branches()[0].id : undefined);

    return departmentId || branchId ? { departmentId, branchId } : null;
  });

  constructor() {
    effect(() => {
      const identity = this.session.identity();
      this.selection.set(identity ? this.read(identity.userId) : {});
    });
  }

  setDepartment(id: string | null): void {
    this.update({ departmentId: id ?? undefined });
  }

  setBranch(id: string | null): void {
    this.update({ branchId: id ?? undefined });
  }

  private update(patch: StoredSelection): void {
    const next = { ...this.selection(), ...patch };
    this.selection.set(next);

    const userId = this.session.identity()?.userId;
    if (userId) {
      localStorage.setItem(this.key(userId), JSON.stringify(next));
    }
  }

  private read(userId: string): StoredSelection {
    try {
      return JSON.parse(localStorage.getItem(this.key(userId)) ?? '{}') as StoredSelection;
    } catch {
      return {};
    }
  }

  private key(userId: string): string {
    return `crm.scope.${userId}`;
  }
}
```

```ts
// libs/shared/permissions/src/lib/provide-active-scope.ts
import { EnvironmentProviders, inject, makeEnvironmentProviders } from '@angular/core';
import { ACTIVE_SCOPE_PROVIDER } from '@crm/shared/http';
import { ScopeContextService } from './scope-context.service';

export function provideActiveScope(): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: ACTIVE_SCOPE_PROVIDER,
      useFactory: () => {
        const context = inject(ScopeContextService);
        return { current: () => context.active() };
      },
    },
  ]);
}
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
npx nx test shared-permissions
npx nx lint shared-permissions
```

Expected: PASS, all five cases — in particular the pair proving scope attaches only on opt-in.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(permissions): add active scope context with opt-in request attachment

Scope is attached only to requests that opt in via HttpContext, never globally,
so GET /me and other unscoped calls stay unfiltered. Selection persists per
user. Department/branch model is a placeholder pending open question B1.
Spec sections 6.4, 8.3."
```

**Completion criteria:** memberships derive from identity; a sole membership is selected automatically while an ambiguous choice is left unmade; selection persists per user; `GET /api/me` carries no scope parameters while an opted-in request carries both; the B1 placeholder is labelled in code.

---

### Task 13: Observability

Ships the abstraction and a no-op implementation. No vendor SDK is added: whether third-party reporting is permissible is open question P2.

**Files:**
- Create: `libs/shared/observability/src/lib/telemetry.ts`, `telemetry.spec.ts`
- Create: `libs/shared/observability/src/lib/noop-observability.client.ts`
- Create: `libs/shared/observability/src/lib/global-error-handler.ts`, `global-error-handler.spec.ts`
- Create: `libs/shared/observability/src/lib/provide-observability.ts`
- Create: `libs/shared/observability/src/index.ts`

**Interfaces:**
- Consumes: `AppError`, `isAppError` (Task 4)
- Produces:
  - `const TELEMETRY_ALLOWLIST: ReadonlySet<string>`
  - `function sanitizeTelemetry(fields: Record<string, unknown>): Record<string, string | number | boolean>`
  - `abstract class ObservabilityClient` with `reportError(error: AppError, context?: Record<string, unknown>): void` and `track(name: string, fields?: Record<string, unknown>): void`
  - `class NoopObservabilityClient extends ObservabilityClient`
  - `function provideObservability(client?: Type<ObservabilityClient>): EnvironmentProviders`

- [ ] **Step 1: Generate the library**

```bash
npx nx g @nx/angular:library shared-observability \
  --directory=libs/shared/observability \
  --unitTestRunner=vitest --standalone --skipModule \
  --tags=scope:shared,type:util --no-interactive
```

- [ ] **Step 2: Write the failing test**

```ts
// libs/shared/observability/src/lib/telemetry.spec.ts
import { describe, expect, it, vi } from 'vitest';
import { sanitizeTelemetry, TELEMETRY_ALLOWLIST } from './telemetry';

describe('sanitizeTelemetry', () => {
  it('keeps allowlisted fields', () => {
    const result = sanitizeTelemetry({
      route: '/tickets',
      locale: 'ar',
      direction: 'rtl',
      errorCode: 'ticket.not_found',
      traceId: 't-1',
      durationMs: 120,
    });
    expect(result).toEqual({
      route: '/tickets', locale: 'ar', direction: 'rtl',
      errorCode: 'ticket.not_found', traceId: 't-1', durationMs: 120,
    });
  });

  it.each([
    'customerName', 'email', 'phone', 'ticketBody', 'chatMessage',
    'attachmentName', 'searchQuery', 'subject',
  ])('drops the non-allowlisted field "%s"', (field) => {
    expect(sanitizeTelemetry({ route: '/x', [field]: 'sensitive' })).toEqual({ route: '/x' });
  });

  it('drops an arbitrary domain object rather than serializing it', () => {
    expect(sanitizeTelemetry({ route: '/x', ticket: { id: 't1', title: 'Broken' } })).toEqual({
      route: '/x',
    });
  });

  it('warns in development when a field is dropped', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    sanitizeTelemetry({ customerName: 'Ada' });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('customerName'));
    warn.mockRestore();
  });

  it('does not allowlist any content-bearing field', () => {
    for (const field of ['ticketBody', 'chatMessage', 'customerName', 'searchQuery']) {
      expect(TELEMETRY_ALLOWLIST.has(field)).toBe(false);
    }
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

```bash
npx nx test shared-observability
```

Expected: FAIL — `sanitizeTelemetry` is not defined.

- [ ] **Step 4: Implement the allowlist and client**

```ts
// libs/shared/observability/src/lib/telemetry.ts
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
```

```ts
// libs/shared/observability/src/lib/noop-observability.client.ts
import { Injectable, isDevMode } from '@angular/core';
import type { AppError } from '@crm/shared/http';
import { sanitizeTelemetry } from './telemetry';

export abstract class ObservabilityClient {
  abstract reportError(error: AppError, context?: Record<string, unknown>): void;
  abstract track(name: string, fields?: Record<string, unknown>): void;
}

/**
 * Default implementation. No vendor SDK is added: whether third-party reporting
 * is permissible may be constrained by data-residency policy (open question P2).
 * Swapping in a real client requires no change outside provideObservability.
 */
@Injectable()
export class NoopObservabilityClient extends ObservabilityClient {
  reportError(error: AppError, context: Record<string, unknown> = {}): void {
    if (isDevMode()) {
      console.error('[observability] error', {
        code: error.code,
        httpStatus: error.httpStatus,
        traceId: error.traceId,
        ...sanitizeTelemetry(context),
      });
    }
  }

  track(name: string, fields: Record<string, unknown> = {}): void {
    if (isDevMode()) {
      console.debug('[observability] event', name, sanitizeTelemetry(fields));
    }
  }
}
```

- [ ] **Step 5: Write the failing test for the global error handler**

```ts
// libs/shared/observability/src/lib/global-error-handler.spec.ts
import { ErrorHandler } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ObservabilityClient } from './noop-observability.client';
import { provideObservability } from './provide-observability';

describe('GlobalErrorHandler', () => {
  let reportError: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    reportError = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        provideObservability(),
        { provide: ObservabilityClient, useValue: { reportError, track: vi.fn() } },
      ],
    });
  });

  it('reports an already-normalized AppError unchanged', () => {
    const appError = { code: 'ticket.not_found', retriable: false, traceId: 't-1' };
    TestBed.inject(ErrorHandler).handleError(appError);
    expect(reportError).toHaveBeenCalledWith(appError, expect.anything());
  });

  it('normalizes an unexpected throwable before reporting', () => {
    TestBed.inject(ErrorHandler).handleError(new TypeError('boom'));
    expect(reportError).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'client.unexpected_error' }),
      expect.anything(),
    );
  });
});
```

- [ ] **Step 6: Implement the handler and provider**

```ts
// libs/shared/observability/src/lib/global-error-handler.ts
import { ErrorHandler, inject, Injectable } from '@angular/core';
import { isAppError, toAppError } from '@crm/shared/http';
import { ObservabilityClient } from './noop-observability.client';

/** Uncaught exceptions are reported; users see a generic translated message (spec section 10.1). */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly client = inject(ObservabilityClient);

  handleError(error: unknown): void {
    const appError = isAppError(error) ? error : toAppError(error);
    this.client.reportError(appError, { route: location.pathname });
  }
}
```

```ts
// libs/shared/observability/src/lib/provide-observability.ts
import { EnvironmentProviders, ErrorHandler, makeEnvironmentProviders, Type } from '@angular/core';
import { GlobalErrorHandler } from './global-error-handler';
import { NoopObservabilityClient, ObservabilityClient } from './noop-observability.client';

export function provideObservability(
  client: Type<ObservabilityClient> = NoopObservabilityClient,
): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: ObservabilityClient, useClass: client },
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
  ]);
}
```

- [ ] **Step 7: Run the tests to verify they pass**

```bash
npx nx test shared-observability
```

Expected: PASS, all twelve cases.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(observability): add allowlisted telemetry and global error handler

Only allowlisted fields are ever transmitted; there is no catch-all
serialization path, so user content cannot leak by accident. Ships a no-op
client because the vendor and data-residency question is open (P2).
Spec sections 10.1, 10.7."
```

**Completion criteria:** a non-allowlisted field is dropped and warned about in development; no content-bearing field is allowlisted; uncaught throwables are normalized before reporting; no vendor SDK is present.

---

### Task 14: Realtime connection

**Files:**
- Create: `libs/shared/realtime/src/lib/realtime-transport.ts`
- Create: `libs/shared/realtime/src/lib/websocket-transport.ts`
- Create: `libs/shared/realtime/src/lib/realtime.service.ts`, `realtime.service.spec.ts`
- Create: `libs/shared/realtime/src/lib/provide-realtime.ts`
- Create: `libs/shared/realtime/src/index.ts`

**Interfaces:**
- Consumes: `APP_CONFIG` (Task 2)
- Produces:
  - `interface RealtimeTransport { connect(url: string): void; send(payload: unknown): void; close(): void; readonly messages: Observable<RealtimeMessage>; readonly opened: Observable<void>; readonly closed: Observable<void>; }`
  - `const REALTIME_TRANSPORT: InjectionToken<RealtimeTransport>`
  - `interface RealtimeMessage { topic: string; payload: unknown; }`
  - `class RealtimeService` with `connectionState: Signal<ConnectionState>`, `subscribe<T>(topic: string): Observable<T>`, `reconnected: Observable<readonly string[]>`
  - `type ConnectionState = 'idle' | 'connecting' | 'open' | 'reconnecting' | 'closed'`

- [ ] **Step 1: Generate the library**

```bash
npx nx g @nx/angular:library shared-realtime \
  --directory=libs/shared/realtime \
  --unitTestRunner=vitest --standalone --skipModule \
  --tags=scope:shared,type:util --no-interactive
```

- [ ] **Step 2: Write the failing test with a fake transport**

```ts
// libs/shared/realtime/src/lib/realtime.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { APP_CONFIG } from '@crm/shared/config';
import { REALTIME_TRANSPORT, type RealtimeMessage, type RealtimeTransport } from './realtime-transport';
import { RealtimeService } from './realtime.service';

class FakeTransport implements RealtimeTransport {
  readonly messages = new Subject<RealtimeMessage>();
  readonly opened = new Subject<void>();
  readonly closed = new Subject<void>();
  readonly sent: unknown[] = [];
  connectCount = 0;

  connect(): void {
    this.connectCount++;
  }
  send(payload: unknown): void {
    this.sent.push(payload);
  }
  close(): void {
    this.closed.next();
  }
}

describe('RealtimeService', () => {
  let service: RealtimeService;
  let transport: FakeTransport;

  beforeEach(() => {
    transport = new FakeTransport();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: APP_CONFIG,
          useValue: {
            apiBaseUrl: 'http://localhost/api', socketUrl: 'ws://localhost/ws',
            enabledChannels: [], enabledAiCapabilities: [], featureFlagDefaults: {},
          },
        },
        { provide: REALTIME_TRANSPORT, useValue: transport },
        RealtimeService,
      ],
    });
    service = TestBed.inject(RealtimeService);
  });

  it('starts idle and connects on the first subscription', () => {
    expect(service.connectionState()).toBe('idle');
    service.subscribe('tickets:dept-1').subscribe();
    expect(service.connectionState()).toBe('connecting');
    expect(transport.connectCount).toBe(1);
  });

  it('sends a subscribe frame once the connection opens', () => {
    service.subscribe('tickets:dept-1').subscribe();
    transport.opened.next();

    expect(service.connectionState()).toBe('open');
    expect(transport.sent).toContainEqual({ type: 'subscribe', topic: 'tickets:dept-1' });
  });

  it('routes a message only to subscribers of its topic', () => {
    const tickets: unknown[] = [];
    const chat: unknown[] = [];
    service.subscribe('tickets:dept-1').subscribe((m) => tickets.push(m));
    service.subscribe('chat:c-1').subscribe((m) => chat.push(m));
    transport.opened.next();

    transport.messages.next({ topic: 'chat:c-1', payload: { text: 'hello' } });

    expect(chat).toEqual([{ text: 'hello' }]);
    expect(tickets).toEqual([]);
  });

  it('multiplexes one connection across many topics', () => {
    service.subscribe('a').subscribe();
    service.subscribe('b').subscribe();
    service.subscribe('c').subscribe();
    expect(transport.connectCount).toBe(1);
  });

  it('resubscribes every active topic after a reconnect', () => {
    service.subscribe('tickets:dept-1').subscribe();
    service.subscribe('chat:c-1').subscribe();
    transport.opened.next();
    transport.sent.length = 0;

    transport.closed.next();
    expect(service.connectionState()).toBe('reconnecting');

    transport.opened.next();
    expect(transport.sent).toEqual([
      { type: 'subscribe', topic: 'tickets:dept-1' },
      { type: 'subscribe', topic: 'chat:c-1' },
    ]);
  });

  it('announces only the topics that were active, so stores invalidate narrowly', () => {
    const announced: readonly string[][] = [];
    service.reconnected.subscribe((topics) => announced.push([...topics]));

    service.subscribe('tickets:dept-1').subscribe();
    transport.opened.next();
    transport.closed.next();
    transport.opened.next();

    expect(announced).toEqual([['tickets:dept-1']]);
  });

  it('unsubscribes the topic when its last subscriber leaves', () => {
    const subscription = service.subscribe('tickets:dept-1').subscribe();
    transport.opened.next();
    transport.sent.length = 0;

    subscription.unsubscribe();

    expect(transport.sent).toContainEqual({ type: 'unsubscribe', topic: 'tickets:dept-1' });
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

```bash
npx nx test shared-realtime
```

Expected: FAIL — `RealtimeService` is not defined.

- [ ] **Step 4: Implement the transport seam**

```ts
// libs/shared/realtime/src/lib/realtime-transport.ts
import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

export interface RealtimeMessage {
  readonly topic: string;
  readonly payload: unknown;
}

/** Seam so the connection manager is testable without a real socket. */
export interface RealtimeTransport {
  connect(url: string): void;
  send(payload: unknown): void;
  close(): void;
  readonly messages: Observable<RealtimeMessage>;
  readonly opened: Observable<void>;
  readonly closed: Observable<void>;
}

export const REALTIME_TRANSPORT = new InjectionToken<RealtimeTransport>('REALTIME_TRANSPORT');
```

- [ ] **Step 5: Implement the connection manager**

```ts
// libs/shared/realtime/src/lib/realtime.service.ts
import { inject, Injectable, signal } from '@angular/core';
import { filter, finalize, map, Observable, share, Subject } from 'rxjs';
import { APP_CONFIG } from '@crm/shared/config';
import { REALTIME_TRANSPORT } from './realtime-transport';

export type ConnectionState = 'idle' | 'connecting' | 'open' | 'reconnecting' | 'closed';

const BASE_RECONNECT_MS = 500;
const MAX_RECONNECT_MS = 15_000;

/**
 * One socket per application session, multiplexed by topic (spec section 8.7).
 *
 * AUTHORIZATION IS SERVER-ENFORCED. Topic names are addressing, not capability:
 * knowing or guessing a topic name grants nothing, and the server validates
 * every subscription against the subscriber's permissions and scope.
 */
@Injectable({ providedIn: 'root' })
export class RealtimeService {
  private readonly transport = inject(REALTIME_TRANSPORT);
  private readonly config = inject(APP_CONFIG);

  private readonly state = signal<ConnectionState>('idle');
  readonly connectionState = this.state.asReadonly();

  /** Emits the topics that were active, so only their stores are invalidated. */
  private readonly reconnectedSubject = new Subject<readonly string[]>();
  readonly reconnected = this.reconnectedSubject.asObservable();

  private readonly subscriberCounts = new Map<string, number>();
  private started = false;
  private hasConnectedOnce = false;
  private reconnectAttempts = 0;

  subscribe<T>(topic: string): Observable<T> {
    this.retain(topic);
    this.ensureStarted();

    return this.transport.messages.pipe(
      filter((message) => message.topic === topic),
      map((message) => message.payload as T),
      finalize(() => this.release(topic)),
      share(),
    );
  }

  private ensureStarted(): void {
    if (this.started) {
      return;
    }
    this.started = true;

    this.transport.opened.subscribe(() => {
      this.state.set('open');
      this.reconnectAttempts = 0;

      const topics = [...this.subscriberCounts.keys()];
      for (const topic of topics) {
        this.transport.send({ type: 'subscribe', topic });
      }

      if (this.hasConnectedOnce && topics.length > 0) {
        // Refetch only what was actually subscribed. Missed-event replay is
        // deliberately not attempted (spec section 8.7).
        this.reconnectedSubject.next(topics);
      }
      this.hasConnectedOnce = true;
    });

    this.transport.closed.subscribe(() => {
      if (this.subscriberCounts.size === 0) {
        this.state.set('closed');
        return;
      }
      this.state.set('reconnecting');
      this.scheduleReconnect();
    });

    this.state.set('connecting');
    this.transport.connect(this.config.socketUrl);
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    const delay = Math.min(BASE_RECONNECT_MS * 2 ** (this.reconnectAttempts - 1), MAX_RECONNECT_MS);
    setTimeout(() => this.transport.connect(this.config.socketUrl), delay);
  }

  private retain(topic: string): void {
    const next = (this.subscriberCounts.get(topic) ?? 0) + 1;
    this.subscriberCounts.set(topic, next);
    if (next === 1 && this.state() === 'open') {
      this.transport.send({ type: 'subscribe', topic });
    }
  }

  private release(topic: string): void {
    const next = (this.subscriberCounts.get(topic) ?? 1) - 1;
    if (next > 0) {
      this.subscriberCounts.set(topic, next);
      return;
    }
    this.subscriberCounts.delete(topic);
    if (this.state() === 'open') {
      this.transport.send({ type: 'unsubscribe', topic });
    }
  }
}
```

- [ ] **Step 6: Implement the WebSocket transport and provider**

```ts
// libs/shared/realtime/src/lib/websocket-transport.ts
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import type { RealtimeMessage, RealtimeTransport } from './realtime-transport';

@Injectable()
export class WebSocketTransport implements RealtimeTransport {
  readonly messages = new Subject<RealtimeMessage>();
  readonly opened = new Subject<void>();
  readonly closed = new Subject<void>();

  private socket: WebSocket | null = null;

  connect(url: string): void {
    this.socket?.close();
    const socket = new WebSocket(url);
    this.socket = socket;

    socket.onopen = () => this.opened.next();
    socket.onclose = () => this.closed.next();
    socket.onerror = () => socket.close();
    socket.onmessage = (event) => {
      try {
        this.messages.next(JSON.parse(event.data as string) as RealtimeMessage);
      } catch {
        // A frame we cannot parse is dropped; the socket stays healthy.
      }
    };
  }

  send(payload: unknown): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(payload));
    }
  }

  close(): void {
    this.socket?.close();
    this.socket = null;
  }
}
```

```ts
// libs/shared/realtime/src/lib/provide-realtime.ts
import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { REALTIME_TRANSPORT } from './realtime-transport';
import { WebSocketTransport } from './websocket-transport';

export function provideRealtime(): EnvironmentProviders {
  return makeEnvironmentProviders([
    WebSocketTransport,
    { provide: REALTIME_TRANSPORT, useExisting: WebSocketTransport },
  ]);
}
```

- [ ] **Step 7: Run the test to verify it passes**

```bash
npx nx test shared-realtime
npx nx lint shared-realtime
```

Expected: PASS, all seven cases.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(realtime): add multiplexed connection manager with narrow reconnect

One socket per session multiplexed by topic, with capped exponential-backoff
reconnect and resubscription. Reconnect announces only the topics that were
active, so stores invalidate narrowly rather than wholesale; missed-event replay
is deliberately not attempted. Spec section 8.7."
```

**Completion criteria:** many topics share one connection; messages route only to their topic's subscribers; reconnect resubscribes and announces exactly the active topics; the last unsubscriber releases the topic; `connectionState` reflects the lifecycle.

---

### Task 15: Design tokens, PrimeNG theme, CSS rules

**Blocked by B2 and B3.** Do not start until the user has supplied brand colors and typography — or explicitly approved proceeding with temporary placeholder tokens — and stated the browser support matrix. The token model is what every later component consumes, and the supported browser floor decides which CSS features the layout strategy can rely on.

**Files:**
- Create: `libs/shared/ui/src/styles/_tokens.scss`
- Create: `libs/shared/ui/src/styles/_typography.scss`
- Create: `libs/shared/ui/src/lib/theme/crm-preset.ts`
- Create: `libs/shared/ui/src/lib/theme/provide-crm-theme.ts`
- Create: `.stylelintrc.json`
- Create: `libs/shared/ui/eslint.config.mjs`
- Modify: `apps/agent-app/src/styles.scss`, `apps/portal-app/src/styles.scss`
- Modify: `package.json` (stylelint target)

**Interfaces:**
- Consumes: nothing
- Produces:
  - CSS custom properties under `:root` — the `--crm-*` token namespace every component uses
  - `const CrmPreset` — a PrimeNG preset built from those tokens
  - `function provideCrmTheme(): EnvironmentProviders`

- [ ] **Step 1: Generate the library and install PrimeNG**

```bash
npx nx g @nx/angular:library shared-ui \
  --directory=libs/shared/ui \
  --unitTestRunner=vitest --standalone --skipModule \
  --tags=scope:shared,type:ui --no-interactive

npm install primeng @primeuix/themes
npm install --save-dev stylelint stylelint-config-standard-scss
```

- [ ] **Step 2: Lift the PrimeNG import restriction for this library only**

```js
// libs/shared/ui/eslint.config.mjs
import baseConfig from '../../../eslint.config.mjs';

export default [
  ...baseConfig,
  {
    files: ['**/*.ts'],
    rules: {
      // shared/ui is the ONLY library permitted to import primeng/* (spec sections 4.3, 9.4).
      'no-restricted-imports': 'off',
    },
  },
];
```

- [ ] **Step 3: Write the failing stylelint check**

Create a file that violates the logical-property rule, so the rule is proved live rather than merely configured:

```scss
// libs/shared/ui/src/styles/_probe.scss
// TEMPORARY — deleted in Step 6.
.probe {
  margin-left: 1rem;
  text-align: left;
}
```

```json
// .stylelintrc.json
{
  "extends": ["stylelint-config-standard-scss"],
  "reportDescriptionlessDisables": true,
  "rules": {
    "property-disallowed-list": [
      [
        "margin-left", "margin-right",
        "padding-left", "padding-right",
        "border-left", "border-right",
        "left", "right",
        "border-top-left-radius", "border-top-right-radius",
        "border-bottom-left-radius", "border-bottom-right-radius"
      ],
      {
        "message": "Use logical properties (margin-inline-start, inset-inline-end, border-start-start-radius). Physical properties require a documented stylelint-disable with a description (spec section 9.3)."
      }
    ],
    "declaration-property-value-disallowed-list": {
      "text-align": ["left", "right"],
      "float": ["left", "right"],
      "clear": ["left", "right"]
    }
  }
}
```

Add the target to `package.json`:

```json
{
  "scripts": {
    "lint:styles": "stylelint \"{apps,libs}/**/*.scss\""
  }
}
```

- [ ] **Step 4: Run stylelint to verify the probe fails**

```bash
npm run lint:styles
```

Expected: FAIL, reporting `margin-left` and `text-align: left`. If it passes, the rule is not wired.

- [ ] **Step 5: Verify the documented-exception path works**

Edit the probe to carry a described disable:

```scss
.probe {
  /* stylelint-disable-next-line property-disallowed-list -- documented exception: third-party
     widget positions itself with a physical property and ignores logical equivalents. */
  margin-left: 1rem;
}
```

Run `npm run lint:styles`. Expected: PASS. Then remove the description and re-run — expected: FAIL on `reportDescriptionlessDisables`. This proves exceptions are possible but must be justified.

- [ ] **Step 6: Delete the probe**

```bash
rm libs/shared/ui/src/styles/_probe.scss
```

- [ ] **Step 7: Write the tokens**

Replace the placeholder values below with the brand values from B2. If B2 resolved as "temporary tokens approved", keep these and leave the comment in place.

```scss
// libs/shared/ui/src/styles/_tokens.scss
// Design tokens. Every component reads these; the PrimeNG theme is generated
// FROM them, so theming and a future dark mode never touch component code
// (spec section 9.4).
//
// TEMPORARY PLACEHOLDER VALUES pending brand definition (open question B2).

:root {
  // --- color ---
  --crm-color-surface: #ffffff;
  --crm-color-surface-raised: #f7f8fa;
  --crm-color-surface-sunken: #eef0f4;
  --crm-color-border: #d8dce4;
  --crm-color-text: #1b1f27;
  --crm-color-text-muted: #5a6270;
  --crm-color-primary: #1f6feb;
  --crm-color-primary-contrast: #ffffff;
  --crm-color-danger: #c0362c;
  --crm-color-warning: #a8630b;
  --crm-color-success: #1a7f52;
  --crm-color-focus-ring: #1f6feb;

  // --- spacing ---
  --crm-space-1: 0.25rem;
  --crm-space-2: 0.5rem;
  --crm-space-3: 0.75rem;
  --crm-space-4: 1rem;
  --crm-space-6: 1.5rem;
  --crm-space-8: 2rem;

  // --- radius ---
  --crm-radius-sm: 0.25rem;
  --crm-radius-md: 0.5rem;
  --crm-radius-lg: 0.75rem;

  // --- elevation ---
  --crm-elevation-1: 0 1px 2px rgb(0 0 0 / 8%);
  --crm-elevation-2: 0 4px 12px rgb(0 0 0 / 12%);

  // --- typography ---
  --crm-font-size-sm: 0.875rem;
  --crm-font-size-md: 1rem;
  --crm-font-size-lg: 1.25rem;
}
```

- [ ] **Step 8: Write the bilingual typography**

```scss
// libs/shared/ui/src/styles/_typography.scss
// Arabic and Latin get separate stacks with different leading. Arabic needs more
// leading at the same nominal size; one stack for both is what makes bilingual
// interfaces look subtly wrong (spec section 9.4).

:root {
  --crm-font-family-latin: 'Inter', 'Segoe UI', system-ui, sans-serif;
  --crm-font-family-arabic: 'IBM Plex Sans Arabic', 'Noto Sans Arabic', 'Segoe UI', sans-serif;

  --crm-line-height-latin: 1.5;
  --crm-line-height-arabic: 1.75;
}

html[lang='en'] body {
  font-family: var(--crm-font-family-latin);
  line-height: var(--crm-line-height-latin);
}

html[lang='ar'] body {
  font-family: var(--crm-font-family-arabic);
  line-height: var(--crm-line-height-arabic);
}
```

- [ ] **Step 9: Generate the PrimeNG theme from the tokens**

```ts
// libs/shared/ui/src/lib/theme/crm-preset.ts
import Aura from '@primeuix/themes/aura';
import { definePreset } from '@primeuix/themes';

/**
 * The PrimeNG theme is generated FROM our tokens, so a token change propagates
 * to every vendor component without touching component code (spec section 9.4).
 */
export const CrmPreset = definePreset(Aura, {
  semantic: {
    primary: {
      color: 'var(--crm-color-primary)',
      contrastColor: 'var(--crm-color-primary-contrast)',
      hoverColor: 'var(--crm-color-primary)',
      activeColor: 'var(--crm-color-primary)',
    },
    focusRing: {
      width: '2px',
      style: 'solid',
      color: 'var(--crm-color-focus-ring)',
      offset: '2px',
    },
    borderRadius: {
      sm: 'var(--crm-radius-sm)',
      md: 'var(--crm-radius-md)',
      lg: 'var(--crm-radius-lg)',
    },
    colorScheme: {
      light: {
        surface: {
          0: 'var(--crm-color-surface)',
          50: 'var(--crm-color-surface-raised)',
          100: 'var(--crm-color-surface-sunken)',
        },
        text: {
          color: 'var(--crm-color-text)',
          mutedColor: 'var(--crm-color-text-muted)',
        },
      },
    },
  },
});
```

```ts
// libs/shared/ui/src/lib/theme/provide-crm-theme.ts
import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { providePrimeNG } from 'primeng/config';
import { CrmPreset } from './crm-preset';

export function provideCrmTheme(): EnvironmentProviders {
  return makeEnvironmentProviders([
    providePrimeNG({ theme: { preset: CrmPreset, options: { darkModeSelector: '.crm-dark' } } }),
  ]);
}
```

- [ ] **Step 10: Wire the styles into both applications**

```scss
// apps/agent-app/src/styles.scss
@use '../../../libs/shared/ui/src/styles/tokens';
@use '../../../libs/shared/ui/src/styles/typography';

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: var(--crm-color-surface);
  color: var(--crm-color-text);
  font-size: var(--crm-font-size-md);
}
```

Write the same file for `portal-app`.

- [ ] **Step 11: Verify lint and builds**

```bash
npm run lint:styles
npx nx build agent-app
npx nx build portal-app
```

Expected: all PASS.

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "feat(ui): add design tokens, bilingual typography, and token-driven PrimeNG theme

Tokens are CSS custom properties in one place and the PrimeNG preset is
generated from them, so theming never touches component code. Adds the stylelint
rule making logical properties mandatory, with documented exceptions permitted
via described disables. Spec sections 9.3, 9.4."
```

**Completion criteria:** a physical property fails stylelint; a described disable passes while a descriptionless one fails; the PrimeNG theme reads token variables; Arabic and Latin have distinct stacks and leading; `primeng/*` imports are permitted only here.

---

### Task 16: UI primitives I — directional icon, button, form field

Each component here earns its place by adding something a raw PrimeNG import does not: direction mirroring, translation, or consistent validation rendering. No pass-through wrappers.

**Files:**
- Create: `libs/shared/ui/src/lib/directional-icon/directional-icon.component.ts`, `.spec.ts`
- Create: `libs/shared/ui/src/lib/button/ui-button.component.ts`, `.spec.ts`
- Create: `libs/shared/ui/src/lib/form-field/form-field.component.ts`, `.spec.ts`
- Create: `libs/shared/ui/src/lib/form-field/validation-message.pipe.ts`
- Modify: `libs/shared/ui/src/index.ts`

**Interfaces:**
- Consumes: `LanguageStore` (Task 6), Transloco (Task 5)
- Produces:
  - `DirectionalIconComponent` — selector `crm-directional-icon`, inputs `name: string`, `mirrored = true`
  - `UiButtonComponent` — selector `crm-button`, inputs `labelKey: string`, `variant`, `loading`, `disabled`, `icon?`, output `clicked`
  - `FormFieldComponent` — selector `crm-form-field`, inputs `labelKey: string`, `control: AbstractControl`, `hintKey?`
  - `ValidationMessagePipe` — `validationMessage` maps Angular validation errors to translation keys

- [ ] **Step 1: Write the failing tests**

```ts
// libs/shared/ui/src/lib/directional-icon/directional-icon.component.spec.ts
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { LanguageStore } from '@crm/shared/i18n';
import { DirectionalIconComponent } from './directional-icon.component';

describe('DirectionalIconComponent', () => {
  let language: LanguageStore;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [DirectionalIconComponent] });
    language = TestBed.inject(LanguageStore);
  });

  const render = (name: string, mirrored = true) => {
    const fixture = TestBed.createComponent(DirectionalIconComponent);
    fixture.componentRef.setInput('name', name);
    fixture.componentRef.setInput('mirrored', mirrored);
    fixture.detectChanges();
    return fixture.nativeElement.querySelector('span') as HTMLElement;
  };

  it('does not mirror in a left-to-right language', () => {
    language.setLanguage('en');
    expect(render('arrow-forward').classList.contains('crm-icon--mirrored')).toBe(false);
  });

  it('mirrors a directional icon in a right-to-left language', () => {
    language.setLanguage('ar');
    expect(render('arrow-forward').classList.contains('crm-icon--mirrored')).toBe(true);
  });

  it('leaves a non-directional icon unmirrored even in Arabic', () => {
    language.setLanguage('ar');
    expect(render('search', false).classList.contains('crm-icon--mirrored')).toBe(false);
  });
});
```

```ts
// libs/shared/ui/src/lib/form-field/form-field.component.spec.ts
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslocoService } from '@jsverse/transloco';
import { beforeEach, describe, expect, it } from 'vitest';
import { provideAppTranslation } from '@crm/shared/i18n';
import { FormFieldComponent } from './form-field.component';

@Component({
  standalone: true,
  imports: [FormFieldComponent, ReactiveFormsModule],
  template: `
    <crm-form-field labelKey="form.email" [control]="email">
      <input [formControl]="email" />
    </crm-form-field>
  `,
})
class HostComponent {
  readonly email = new FormControl('', [Validators.required, Validators.email]);
}

describe('FormFieldComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostComponent], providers: [provideAppTranslation()] });
    TestBed.inject(TranslocoService).setTranslation(
      {
        'form.email': 'Email',
        'validation.required': 'This field is required',
        'validation.email': 'Enter a valid email address',
      },
      'en',
    );
    TestBed.inject(TranslocoService).setActiveLang('en');
  });

  const render = () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    return fixture;
  };

  it('renders the translated label', () => {
    const element = render().nativeElement as HTMLElement;
    expect(element.querySelector('label')?.textContent).toContain('Email');
  });

  it('shows no error while the control is untouched', () => {
    const element = render().nativeElement as HTMLElement;
    expect(element.querySelector('[data-testid="field-error"]')).toBeNull();
  });

  it('renders a translated message once the control is touched and invalid', () => {
    const fixture = render();
    fixture.componentInstance.email.markAsTouched();
    fixture.detectChanges();

    const error = (fixture.nativeElement as HTMLElement).querySelector('[data-testid="field-error"]');
    expect(error?.textContent).toContain('This field is required');
  });

  it('maps each validation error to its own translated message', () => {
    const fixture = render();
    fixture.componentInstance.email.setValue('not-an-email');
    fixture.componentInstance.email.markAsTouched();
    fixture.detectChanges();

    const error = (fixture.nativeElement as HTMLElement).querySelector('[data-testid="field-error"]');
    expect(error?.textContent).toContain('Enter a valid email address');
  });

  it('links the message to the control for assistive technology', () => {
    const fixture = render();
    fixture.componentInstance.email.markAsTouched();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const input = element.querySelector('input');
    const error = element.querySelector('[data-testid="field-error"]');
    expect(input?.getAttribute('aria-describedby')).toBe(error?.id);
    expect(input?.getAttribute('aria-invalid')).toBe('true');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
npx nx test shared-ui
```

Expected: FAIL — the components are not defined.

- [ ] **Step 3: Implement the directional icon**

```ts
// libs/shared/ui/src/lib/directional-icon/directional-icon.component.ts
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { LanguageStore } from '@crm/shared/i18n';

/**
 * Arrows, chevrons, back/forward, and next/previous mirror automatically.
 * Ad-hoc directional icons are where RTL consistently leaks (spec section 9.3).
 */
@Component({
  selector: 'crm-directional-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span [class]="classes()" [attr.aria-hidden]="true"></span>`,
  styles: `
    .crm-icon--mirrored {
      transform: scaleX(-1);
    }
  `,
})
export class DirectionalIconComponent {
  private readonly languageStore = inject(LanguageStore);

  readonly name = input.required<string>();
  /** Set false for icons whose meaning does not depend on reading direction. */
  readonly mirrored = input(true);

  protected readonly classes = computed(() => {
    const base = `crm-icon crm-icon--${this.name()}`;
    const shouldMirror = this.mirrored() && this.languageStore.direction() === 'rtl';
    return shouldMirror ? `${base} crm-icon--mirrored` : base;
  });
}
```

- [ ] **Step 4: Implement the button**

```ts
// libs/shared/ui/src/lib/button/ui-button.component.ts
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { DirectionalIconComponent } from '../directional-icon/directional-icon.component';

/**
 * Adds what a raw PrimeNG button does not: a translation-key label, a loading
 * state that also disables, and direction-aware icon placement. Not a
 * pass-through wrapper (spec section 9.4).
 */
@Component({
  selector: 'crm-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonModule, TranslocoPipe, DirectionalIconComponent],
  template: `
    <button
      pButton
      type="button"
      [severity]="variant()"
      [disabled]="disabled() || loading()"
      [attr.aria-busy]="loading()"
      (click)="clicked.emit()"
    >
      @if (icon(); as iconName) {
        <crm-directional-icon [name]="iconName" [mirrored]="iconMirrored()" />
      }
      <span>{{ labelKey() | transloco }}</span>
    </button>
  `,
})
export class UiButtonComponent {
  readonly labelKey = input.required<string>();
  readonly variant = input<'primary' | 'secondary' | 'danger'>('primary');
  readonly loading = input(false);
  readonly disabled = input(false);
  readonly icon = input<string | undefined>(undefined);
  readonly iconMirrored = input(true);

  readonly clicked = output<void>();
}
```

- [ ] **Step 5: Implement the form field and validation mapping**

```ts
// libs/shared/ui/src/lib/form-field/validation-message.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';
import type { ValidationErrors } from '@angular/forms';

/**
 * Maps Angular validation errors to translation keys, so validation messages are
 * translated like everything else rather than hard-coded per form.
 */
@Pipe({ name: 'validationMessage', standalone: true })
export class ValidationMessagePipe implements PipeTransform {
  transform(errors: ValidationErrors | null): string | null {
    if (!errors) {
      return null;
    }
    const [first] = Object.keys(errors);
    return first ? `validation.${first}` : null;
  }
}
```

```ts
// libs/shared/ui/src/lib/form-field/form-field.component.ts
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  effect,
  inject,
  input,
} from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import { ValidationMessagePipe } from './validation-message.pipe';

let nextId = 0;

/**
 * Label, projected control, and translated validation message in one consistent
 * unit, wired for assistive technology. Field validation is shown inline and
 * carries no traceId — that is reserved for actionable failures
 * (spec section 10.1).
 */
@Component({
  selector: 'crm-form-field',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoPipe, ValidationMessagePipe],
  template: `
    <div class="crm-field">
      <label [attr.for]="controlId">{{ labelKey() | transloco }}</label>
      <ng-content />

      @if (hintKey(); as hint) {
        <p class="crm-field__hint">{{ hint | transloco }}</p>
      }

      @if (showError()) {
        <p class="crm-field__error" role="alert" [id]="errorId" data-testid="field-error">
          {{ (control().errors | validationMessage) ?? 'errors.generic' | transloco }}
        </p>
      }
    </div>
  `,
  styles: `
    .crm-field {
      display: flex;
      flex-direction: column;
      gap: var(--crm-space-1);
      margin-block-end: var(--crm-space-4);
    }

    .crm-field__hint {
      margin: 0;
      color: var(--crm-color-text-muted);
      font-size: var(--crm-font-size-sm);
    }

    .crm-field__error {
      margin: 0;
      color: var(--crm-color-danger);
      font-size: var(--crm-font-size-sm);
    }
  `,
})
export class FormFieldComponent {
  private readonly host = inject(ElementRef<HTMLElement>);

  readonly labelKey = input.required<string>();
  readonly control = input.required<AbstractControl>();
  readonly hintKey = input<string | undefined>(undefined);

  protected readonly controlId = `crm-field-${nextId++}`;
  protected readonly errorId = `${this.controlId}-error`;

  protected readonly showError = computed(() => {
    const control = this.control();
    return control.invalid && (control.touched || control.dirty);
  });

  constructor() {
    // Bind the projected control to its label and message without requiring
    // every consumer to repeat the wiring.
    effect(() => {
      const element = (this.host.nativeElement as HTMLElement).querySelector(
        'input, select, textarea',
      );
      if (!element) {
        return;
      }
      element.id ||= this.controlId;
      element.setAttribute('aria-invalid', String(this.showError()));
      if (this.showError()) {
        element.setAttribute('aria-describedby', this.errorId);
      } else {
        element.removeAttribute('aria-describedby');
      }
    });
  }
}
```

- [ ] **Step 6: Add the validation translation keys**

`ValidationMessagePipe` maps every Angular validation error to `validation.<errorName>`. Those keys must exist, or Task 5's missing-key handler throws in development. Add to all four translation documents (`apps/agent-app/public/i18n/{en,ar}.json` and the portal's pair):

```json
{
  "validation": {
    "required": "This field is required",
    "email": "Enter a valid email address",
    "minlength": "This value is too short",
    "maxlength": "This value is too long",
    "min": "This value is too small",
    "max": "This value is too large",
    "pattern": "This value has the wrong format"
  }
}
```

```json
{
  "validation": {
    "required": "هذا الحقل مطلوب",
    "email": "أدخل بريدًا إلكترونيًا صحيحًا",
    "minlength": "هذه القيمة قصيرة جدًا",
    "maxlength": "هذه القيمة طويلة جدًا",
    "min": "هذه القيمة صغيرة جدًا",
    "max": "هذه القيمة كبيرة جدًا",
    "pattern": "تنسيق هذه القيمة غير صحيح"
  }
}
```

- [ ] **Step 7: Run the tests to verify they pass**

```bash
npx nx test shared-ui
npx nx lint shared-ui
npm run lint:styles
```

Expected: PASS, all eight cases.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(ui): add directional icon, translated button, and validation-aware form field

Each adds something a raw PrimeNG import does not: direction mirroring,
translation-key labels with a loading state, and consistent translated
validation wired for assistive technology. Spec sections 9.3, 9.4, 10.1, 10.5."
```

**Completion criteria:** directional icons mirror in Arabic and not in English; non-directional icons never mirror; the form field renders translated labels and per-error messages, only after touch or change, and links them via `aria-describedby`.

---

### Task 17: UI primitives II — overlays and state components

**Files:**
- Create: `libs/shared/ui/src/lib/overlay/dialog.service.ts`, `dialog.service.spec.ts`
- Create: `libs/shared/ui/src/lib/overlay/drawer.service.ts`
- Create: `libs/shared/ui/src/lib/overlay/confirm.service.ts`
- Create: `libs/shared/ui/src/lib/overlay/toast.service.ts`, `toast.service.spec.ts`
- Create: `libs/shared/ui/src/lib/state/empty-state.component.ts`
- Create: `libs/shared/ui/src/lib/state/error-state.component.ts`, `error-state.component.spec.ts`
- Create: `libs/shared/ui/src/lib/state/loading-skeleton.component.ts`
- Modify: `libs/shared/ui/src/index.ts`

**Interfaces:**
- Consumes: `AppError` (Task 4), Transloco (Task 5), CDK `Dialog`
- Produces:
  - `class DialogService` with `open<TResult, TData>(component: ComponentType<unknown>, data?: TData): Observable<TResult | undefined>`
  - `class DrawerService` with `open<TResult, TData>(component: ComponentType<unknown>, data?: TData): Observable<TResult | undefined>` — edge-anchored panel, used by the tablet layout to collapse side panels (spec section 9.5)
  - `class ConfirmService` with `confirm(options: { titleKey: string; messageKey: string; confirmKey?: string; cancelKey?: string; danger?: boolean }): Promise<boolean>`
  - `class ToastService` with `success(messageKey: string)`, `error(error: AppError)`, `info(messageKey: string)`, and `messages: Signal<ToastMessage[]>`
  - `EmptyStateComponent` — inputs `titleKey`, `descriptionKey?`
  - `ErrorStateComponent` — inputs `error: AppError`, output `retry`
  - `LoadingSkeletonComponent` — input `rows = 3`

- [ ] **Step 1: Write the failing tests**

```ts
// libs/shared/ui/src/lib/overlay/toast.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let toast: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    toast = TestBed.inject(ToastService);
  });

  it('starts with no messages', () => {
    expect(toast.messages()).toEqual([]);
  });

  it('exposes a retry action for a retriable failure', () => {
    toast.error({ code: 'http.unknown_error', retriable: true, traceId: 't-1' });
    const [message] = toast.messages();
    expect(message.retriable).toBe(true);
  });

  it('surfaces traceId on an actionable failure', () => {
    toast.error({ code: 'ticket.update_failed', retriable: false, traceId: 't-9' });
    expect(toast.messages()[0].traceId).toBe('t-9');
  });

  it('translates from the error code, never from a server message', () => {
    toast.error({ code: 'ticket.not_found', retriable: false });
    expect(toast.messages()[0].messageKey).toBe('errors.ticket.not_found');
  });

  it('dismisses by id', () => {
    toast.success('shell.saved');
    const [message] = toast.messages();
    toast.dismiss(message.id);
    expect(toast.messages()).toEqual([]);
  });
});
```

```ts
// libs/shared/ui/src/lib/state/error-state.component.spec.ts
import { TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { provideAppTranslation } from '@crm/shared/i18n';
import { ErrorStateComponent } from './error-state.component';

describe('ErrorStateComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ErrorStateComponent],
      providers: [provideAppTranslation()],
    });
    const transloco = TestBed.inject(TranslocoService);
    transloco.setTranslation(
      { 'errors.generic': 'Something went wrong.', 'errors.retry': 'Try again', 'errors.copyTraceId': 'Copy reference' },
      'en',
    );
    transloco.setActiveLang('en');
  });

  const render = (error: { code: string; retriable: boolean; traceId?: string }) => {
    const fixture = TestBed.createComponent(ErrorStateComponent);
    fixture.componentRef.setInput('error', error);
    fixture.detectChanges();
    return fixture;
  };

  it('shows the copyable reference when a traceId is present', () => {
    const element = render({ code: 'x', retriable: false, traceId: 'trace-42' })
      .nativeElement as HTMLElement;
    expect(element.querySelector('[data-testid="trace-id"]')?.textContent).toContain('trace-42');
  });

  it('omits the reference entirely when there is no traceId', () => {
    const element = render({ code: 'x', retriable: false }).nativeElement as HTMLElement;
    expect(element.querySelector('[data-testid="trace-id"]')).toBeNull();
  });

  it('emits retry when the action is used', () => {
    const fixture = render({ code: 'x', retriable: true });
    const spy = vi.fn();
    fixture.componentInstance.retry.subscribe(spy);

    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('[data-testid="retry"]')
      ?.click();

    expect(spy).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
npx nx test shared-ui
```

Expected: FAIL — `ToastService` and `ErrorStateComponent` are not defined.

- [ ] **Step 3: Implement the toast service**

```ts
// libs/shared/ui/src/lib/overlay/toast.service.ts
import { Injectable, signal } from '@angular/core';
import type { AppError } from '@crm/shared/http';

export interface ToastMessage {
  readonly id: number;
  readonly severity: 'success' | 'error' | 'info';
  readonly messageKey: string;
  readonly retriable: boolean;
  readonly traceId?: string;
}

let nextId = 0;

/**
 * Action failures surface as toasts, with retry when retriable and the
 * backend-authoritative traceId when present (spec section 10.1). Messages are
 * translated from the error CODE; the server's `message` is a developer
 * diagnostic and is never shown (spec section 8.5).
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly queue = signal<ToastMessage[]>([]);
  readonly messages = this.queue.asReadonly();

  success(messageKey: string): void {
    this.push({ severity: 'success', messageKey, retriable: false });
  }

  info(messageKey: string): void {
    this.push({ severity: 'info', messageKey, retriable: false });
  }

  error(error: AppError): void {
    this.push({
      severity: 'error',
      messageKey: `errors.${error.code}`,
      retriable: error.retriable,
      traceId: error.traceId,
    });
  }

  dismiss(id: number): void {
    this.queue.update((messages) => messages.filter((message) => message.id !== id));
  }

  private push(message: Omit<ToastMessage, 'id'>): void {
    this.queue.update((messages) => [...messages, { ...message, id: nextId++ }]);
  }
}
```

- [ ] **Step 4: Implement the dialog and confirm services**

```ts
// libs/shared/ui/src/lib/overlay/dialog.service.ts
import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { ComponentType } from '@angular/cdk/overlay';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

/**
 * Typed dialog opening on the CDK, which reads the same Directionality the
 * DirectionService drives — so overlays flip with the language automatically
 * (spec section 9.3).
 */
@Injectable({ providedIn: 'root' })
export class DialogService {
  private readonly dialog = inject(Dialog);

  open<TResult, TData = unknown>(
    component: ComponentType<unknown>,
    data?: TData,
  ): Observable<TResult | undefined> {
    const ref: DialogRef<TResult> = this.dialog.open<TResult>(component, {
      data,
      hasBackdrop: true,
      autoFocus: 'first-tabbable',
      restoreFocus: true,
    });
    return ref.closed;
  }
}
```

```ts
// libs/shared/ui/src/lib/overlay/drawer.service.ts
import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { ComponentType } from '@angular/cdk/overlay';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

/**
 * Edge-anchored panel. The tablet layout collapses side panels into these
 * (spec section 9.5). Anchoring is logical — `inset-inline-end` — so the drawer
 * opens from the correct edge in both directions without a second code path.
 */
@Injectable({ providedIn: 'root' })
export class DrawerService {
  private readonly dialog = inject(Dialog);

  open<TResult, TData = unknown>(
    component: ComponentType<unknown>,
    data?: TData,
  ): Observable<TResult | undefined> {
    const ref: DialogRef<TResult> = this.dialog.open<TResult>(component, {
      data,
      hasBackdrop: true,
      panelClass: 'crm-drawer-panel',
      autoFocus: 'first-tabbable',
      restoreFocus: true,
    });
    return ref.closed;
  }
}
```

Add the panel styling to `libs/shared/ui/src/styles/_tokens.scss`'s companion global sheet:

```scss
.crm-drawer-panel {
  position: fixed;
  inset-block: 0;
  inset-inline-end: 0;
  inline-size: min(28rem, 100vw);
  background: var(--crm-color-surface);
  box-shadow: var(--crm-elevation-2);
}
```

```ts
// libs/shared/ui/src/lib/overlay/confirm.service.ts
import { ChangeDetectionStrategy, Component, inject, Injectable } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { TranslocoPipe } from '@jsverse/transloco';
import { firstValueFrom } from 'rxjs';
import { UiButtonComponent } from '../button/ui-button.component';
import { DialogService } from './dialog.service';

export interface ConfirmOptions {
  readonly titleKey: string;
  readonly messageKey: string;
  readonly confirmKey?: string;
  readonly cancelKey?: string;
  readonly danger?: boolean;
}

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoPipe, UiButtonComponent],
  template: `
    <div class="crm-confirm" role="alertdialog" aria-modal="true">
      <h2>{{ data.titleKey | transloco }}</h2>
      <p>{{ data.messageKey | transloco }}</p>
      <div class="crm-confirm__actions">
        <crm-button
          [labelKey]="data.cancelKey ?? 'actions.cancel'"
          variant="secondary"
          (clicked)="ref.close(false)"
        />
        <crm-button
          [labelKey]="data.confirmKey ?? 'actions.confirm'"
          [variant]="data.danger ? 'danger' : 'primary'"
          (clicked)="ref.close(true)"
        />
      </div>
    </div>
  `,
  styles: `
    .crm-confirm {
      max-inline-size: 28rem;
      padding: var(--crm-space-6);
      background: var(--crm-color-surface);
      border-radius: var(--crm-radius-lg);
      box-shadow: var(--crm-elevation-2);
    }

    .crm-confirm__actions {
      display: flex;
      gap: var(--crm-space-2);
      justify-content: flex-end;
      margin-block-start: var(--crm-space-6);
    }
  `,
})
export class ConfirmDialogComponent {
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);
  protected readonly data = inject<ConfirmOptions>(DIALOG_DATA);
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private readonly dialogs = inject(DialogService);

  async confirm(options: ConfirmOptions): Promise<boolean> {
    const result = await firstValueFrom(
      this.dialogs.open<boolean, ConfirmOptions>(ConfirmDialogComponent, options),
    );
    return result === true;
  }
}
```

- [ ] **Step 5: Implement the state components**

```ts
// libs/shared/ui/src/lib/state/error-state.component.ts
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import type { AppError } from '@crm/shared/http';
import { UiButtonComponent } from '../button/ui-button.component';

/**
 * Page-load failure surface: the route is preserved and retry is offered.
 * The backend-authoritative traceId is shown in a copyable form, because without
 * it "it broke" reports are unsolvable (spec section 10.1).
 */
@Component({
  selector: 'crm-error-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoPipe, UiButtonComponent],
  template: `
    <div class="crm-error-state" role="alert">
      <p class="crm-error-state__message">{{ 'errors.' + error().code | transloco }}</p>

      <div class="crm-error-state__actions">
        <crm-button labelKey="errors.retry" data-testid="retry" (clicked)="retry.emit()" />
      </div>

      @if (error().traceId; as traceId) {
        <p class="crm-error-state__trace" data-testid="trace-id">
          <span>{{ 'errors.copyTraceId' | transloco }}:</span>
          <code>{{ traceId }}</code>
        </p>
      }
    </div>
  `,
  styles: `
    .crm-error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--crm-space-4);
      padding: var(--crm-space-8);
      text-align: center;
    }

    .crm-error-state__trace {
      color: var(--crm-color-text-muted);
      font-size: var(--crm-font-size-sm);
    }
  `,
})
export class ErrorStateComponent {
  readonly error = input.required<AppError>();
  readonly retry = output<void>();
}
```

```ts
// libs/shared/ui/src/lib/state/empty-state.component.ts
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'crm-empty-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoPipe],
  template: `
    <div class="crm-empty-state">
      <p class="crm-empty-state__title">{{ titleKey() | transloco }}</p>
      @if (descriptionKey(); as description) {
        <p class="crm-empty-state__description">{{ description | transloco }}</p>
      }
      <ng-content />
    </div>
  `,
  styles: `
    .crm-empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--crm-space-2);
      padding: var(--crm-space-8);
      color: var(--crm-color-text-muted);
      text-align: center;
    }
  `,
})
export class EmptyStateComponent {
  readonly titleKey = input.required<string>();
  readonly descriptionKey = input<string | undefined>(undefined);
}
```

```ts
// libs/shared/ui/src/lib/state/loading-skeleton.component.ts
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'crm-loading-skeleton',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="crm-skeleton" role="status" [attr.aria-busy]="true">
      @for (row of rowList(); track row) {
        <div class="crm-skeleton__row"></div>
      }
    </div>
  `,
  styles: `
    .crm-skeleton {
      display: flex;
      flex-direction: column;
      gap: var(--crm-space-2);
      padding: var(--crm-space-4);
    }

    .crm-skeleton__row {
      block-size: 1rem;
      background: var(--crm-color-surface-sunken);
      border-radius: var(--crm-radius-sm);
    }
  `,
})
export class LoadingSkeletonComponent {
  readonly rows = input(3);
  protected rowList = () => Array.from({ length: this.rows() }, (_, index) => index);
}
```

- [ ] **Step 6: Add the action translation keys**

`ConfirmDialogComponent` defaults to `actions.confirm` and `actions.cancel`. Add to all four translation documents:

```json
{ "actions": { "confirm": "Confirm", "cancel": "Cancel", "save": "Save", "close": "Close" } }
```

```json
{ "actions": { "confirm": "تأكيد", "cancel": "إلغاء", "save": "حفظ", "close": "إغلاق" } }
```

- [ ] **Step 7: Run the tests to verify they pass**

```bash
npx nx test shared-ui
npm run lint:styles
```

Expected: PASS, all eight cases.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(ui): add overlay services and empty/error/loading state components

Toasts translate from the error code rather than the server message and expose
the backend traceId on actionable failures. Dialogs ride the CDK, so they flip
with the language automatically. Spec sections 8.5, 9.3, 10.1."
```

**Completion criteria:** toasts derive their message key from the error code; `traceId` appears only when present; the error state offers retry; overlays are direction-aware through the CDK; all styles use logical properties.

---

### Task 18: Application shell

**Blocked by B1** for the scope switcher only. If B1 is still open, build every other part of the shell and leave the switcher's placement in the header with a feature-gated placeholder; do not guess the department/branch relationship.

**Files:**
- Create: `libs/shared/ui/src/lib/shell/app-shell.component.ts`, `app-shell.component.spec.ts`
- Create: `libs/shared/ui/src/lib/shell/language-switcher.component.ts`, `.spec.ts`
- Create: `libs/shared/ui/src/lib/shell/scope-switcher.component.ts`
- Create: `libs/shared/ui/src/lib/shell/connection-indicator.component.ts`
- Create: `libs/shared/ui/src/lib/shell/viewport.service.ts`, `viewport.service.spec.ts`
- Create: `libs/shared/ui/src/lib/shell/responsive-gate.component.ts`, `.spec.ts`
- Modify: `libs/shared/ui/src/index.ts`

**Interfaces:**
- Consumes: `NavigationService` (Task 11), `ScopeContextService` (Task 12), `LanguageResolver`, `LanguageStore` (Tasks 6, 8), `RealtimeService` (Task 14), `SessionStore` (Task 9)
- Produces:
  - `AppShellComponent` — selector `crm-app-shell`, content slots `[shellHeaderEnd]` (notification bell and anything else an application adds) and default (routed content)
  - `LanguageSwitcherComponent`, `ScopeSwitcherComponent`, `ConnectionIndicatorComponent`
  - `class ViewportService` with `isPhone: Signal<boolean>`, `isTablet: Signal<boolean>`, `isDesktop: Signal<boolean>`
  - `type ResponsivePolicy = 'portal' | 'operational' | 'dashboard'`
  - `ResponsiveGateComponent` — reads `route.data.responsive` and renders the small-screen notice only for `operational`

- [ ] **Step 1: Write the failing tests**

The load-bearing test is the responsive policy: it must be route-specific, so management dashboards stay usable on phones while operational routes do not (spec section 9.5).

```ts
// libs/shared/ui/src/lib/shell/responsive-gate.component.spec.ts
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { ResponsiveGateComponent, type ResponsivePolicy } from './responsive-gate.component';
import { ViewportService } from './viewport.service';

class FakeViewport {
  isPhone = () => true;
  isTablet = () => false;
  isDesktop = () => false;
}

describe('ResponsiveGateComponent', () => {
  let data: BehaviorSubject<{ responsive?: ResponsivePolicy }>;

  beforeEach(() => {
    data = new BehaviorSubject<{ responsive?: ResponsivePolicy }>({});
    TestBed.configureTestingModule({
      imports: [ResponsiveGateComponent],
      providers: [
        { provide: ViewportService, useClass: FakeViewport },
        { provide: ActivatedRoute, useValue: { data } },
      ],
    });
  });

  const render = (policy?: ResponsivePolicy) => {
    data.next(policy ? { responsive: policy } : {});
    const fixture = TestBed.createComponent(ResponsiveGateComponent);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  it('blocks an operational route on a phone', () => {
    expect(render('operational').querySelector('[data-testid="small-screen-notice"]')).not.toBeNull();
  });

  it('does NOT block a dashboard route on a phone', () => {
    expect(render('dashboard').querySelector('[data-testid="small-screen-notice"]')).toBeNull();
  });

  it('does NOT block a portal route on a phone', () => {
    expect(render('portal').querySelector('[data-testid="small-screen-notice"]')).toBeNull();
  });

  it('does not block when no policy is declared', () => {
    expect(render().querySelector('[data-testid="small-screen-notice"]')).toBeNull();
  });
});
```

```ts
// libs/shared/ui/src/lib/shell/language-switcher.component.spec.ts
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { DEVICE_LANGUAGE_KEY, LanguageStore, provideAppTranslation } from '@crm/shared/i18n';
import { LanguageSwitcherComponent } from './language-switcher.component';

describe('LanguageSwitcherComponent', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [LanguageSwitcherComponent],
      providers: [provideAppTranslation()],
    });
  });

  it('treats a switch as an explicit user choice, writing the device preference', () => {
    const fixture = TestBed.createComponent(LanguageSwitcherComponent);
    fixture.detectChanges();

    fixture.componentInstance.choose('ar');
    fixture.detectChanges();

    expect(TestBed.inject(LanguageStore).language()).toBe('ar');
    expect(localStorage.getItem(DEVICE_LANGUAGE_KEY)).toBe('ar');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
npx nx test shared-ui
```

Expected: FAIL — the shell components are not defined.

- [ ] **Step 3: Implement the viewport service**

```ts
// libs/shared/ui/src/lib/shell/viewport.service.ts
import { BreakpointObserver } from '@angular/cdk/layout';
import { computed, inject, Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

/** Shared breakpoint tokens. Both applications read the same values. */
export const BREAKPOINTS = {
  phone: '(max-width: 47.99rem)',
  tablet: '(min-width: 48rem) and (max-width: 63.99rem)',
  desktop: '(min-width: 64rem)',
} as const;

@Injectable({ providedIn: 'root' })
export class ViewportService {
  private readonly observer = inject(BreakpointObserver);

  private readonly state = toSignal(
    this.observer.observe([BREAKPOINTS.phone, BREAKPOINTS.tablet, BREAKPOINTS.desktop]),
    { initialValue: { matches: false, breakpoints: {} as Record<string, boolean> } },
  );

  readonly isPhone = computed(() => this.state().breakpoints[BREAKPOINTS.phone] === true);
  readonly isTablet = computed(() => this.state().breakpoints[BREAKPOINTS.tablet] === true);
  readonly isDesktop = computed(() => this.state().breakpoints[BREAKPOINTS.desktop] === true);
}
```

- [ ] **Step 4: Implement the route-specific responsive gate**

```ts
// libs/shared/ui/src/lib/shell/responsive-gate.component.ts
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoPipe } from '@jsverse/transloco';
import { ViewportService } from './viewport.service';

/**
 * Responsive behavior is ROUTE-SPECIFIC, not application-wide (spec section 9.5):
 *   portal      -> mobile-first, never blocked
 *   operational -> desktop-first, tablet usable, PHONE UNSUPPORTED
 *   dashboard   -> responsive on phones, never blocked
 *
 * Declared per route as `data: { responsive: 'operational' }`.
 */
export type ResponsivePolicy = 'portal' | 'operational' | 'dashboard';

@Component({
  selector: 'crm-responsive-gate',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoPipe],
  template: `
    @if (blocked()) {
      <div class="crm-small-screen" data-testid="small-screen-notice" role="status">
        <p>{{ 'shell.openOnLargerScreen' | transloco }}</p>
      </div>
    } @else {
      <ng-content />
    }
  `,
  styles: `
    .crm-small-screen {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--crm-space-8);
      text-align: center;
      color: var(--crm-color-text-muted);
    }
  `,
})
export class ResponsiveGateComponent {
  private readonly viewport = inject(ViewportService);
  private readonly data = toSignal(inject(ActivatedRoute).data, { initialValue: {} });

  protected readonly blocked = computed(() => {
    const policy = (this.data() as { responsive?: ResponsivePolicy }).responsive;
    return policy === 'operational' && this.viewport.isPhone();
  });
}
```

- [ ] **Step 5: Implement the header components**

```ts
// libs/shared/ui/src/lib/shell/language-switcher.component.ts
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { AppLanguage, LanguageResolver, LanguageStore, SUPPORTED_LANGUAGES } from '@crm/shared/i18n';

@Component({
  selector: 'crm-language-switcher',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoPipe],
  template: `
    <label class="crm-visually-hidden" for="crm-language">{{ 'shell.language' | transloco }}</label>
    <select
      id="crm-language"
      [value]="store.language()"
      (change)="choose($any($event.target).value)"
    >
      @for (language of languages; track language) {
        <option [value]="language">{{ 'shell.languageName.' + language | transloco }}</option>
      }
    </select>
  `,
})
export class LanguageSwitcherComponent {
  protected readonly store = inject(LanguageStore);
  private readonly resolver = inject(LanguageResolver);
  protected readonly languages = SUPPORTED_LANGUAGES;

  /** An explicit user choice: updates the device preference AND the active language. */
  choose(language: AppLanguage): void {
    this.resolver.chooseExplicitly(language);
  }
}
```

```ts
// libs/shared/ui/src/lib/shell/scope-switcher.component.ts
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { ScopeContextService } from '@crm/shared/permissions';

/**
 * Surfaces the active department and branch (spec section 6.4).
 *
 * PLACEHOLDER MODEL pending open question B1: the two are treated as independent
 * selects. If B1 resolves to a nested relationship, this becomes a dependent
 * selection and must be rewritten.
 */
@Component({
  selector: 'crm-scope-switcher',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoPipe],
  template: `
    <fieldset class="crm-scope">
      <legend class="crm-visually-hidden">{{ 'shell.scope' | transloco }}</legend>

      @if (scope.departments().length > 1) {
        <select
          [value]="scope.active()?.departmentId ?? ''"
          (change)="scope.setDepartment($any($event.target).value || null)"
        >
          @for (unit of scope.departments(); track unit.id) {
            <option [value]="unit.id">{{ unit.name }}</option>
          }
        </select>
      }

      @if (scope.branches().length > 1) {
        <select
          [value]="scope.active()?.branchId ?? ''"
          (change)="scope.setBranch($any($event.target).value || null)"
        >
          @for (unit of scope.branches(); track unit.id) {
            <option [value]="unit.id">{{ unit.name }}</option>
          }
        </select>
      }
    </fieldset>
  `,
  styles: `
    .crm-scope {
      display: flex;
      gap: var(--crm-space-2);
      border: 0;
      padding: 0;
      margin: 0;
    }
  `,
})
export class ScopeSwitcherComponent {
  protected readonly scope = inject(ScopeContextService);
}
```

```ts
// libs/shared/ui/src/lib/shell/connection-indicator.component.ts
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { RealtimeService } from '@crm/shared/realtime';

/** Unobtrusive indicator driven by the realtime connectionState (spec section 8.7). */
@Component({
  selector: 'crm-connection-indicator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoPipe],
  template: `
    @if (realtime.connectionState() === 'reconnecting') {
      <span class="crm-connection" role="status" aria-live="polite">
        {{ 'shell.reconnecting' | transloco }}
      </span>
    }
  `,
  styles: `
    .crm-connection {
      color: var(--crm-color-warning);
      font-size: var(--crm-font-size-sm);
    }
  `,
})
export class ConnectionIndicatorComponent {
  protected readonly realtime = inject(RealtimeService);
}
```

- [ ] **Step 6: Implement the shell**

```ts
// libs/shared/ui/src/lib/shell/app-shell.component.ts
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { SessionStore } from '@crm/shared/auth';
import { NavigationService } from '@crm/shared/permissions';
import { ConnectionIndicatorComponent } from './connection-indicator.component';
import { LanguageSwitcherComponent } from './language-switcher.component';
import { ResponsiveGateComponent } from './responsive-gate.component';
import { ScopeSwitcherComponent } from './scope-switcher.component';

/**
 * Layout only. It renders navigation from the permission-filtered manifest and
 * projects whatever the application puts in the header — the notification bell
 * included. The shell holds NO notification data of its own: that is a Phase 2
 * feature (spec sections 5.3, 12.1).
 */
@Component({
  selector: 'crm-app-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    TranslocoPipe,
    LanguageSwitcherComponent,
    ScopeSwitcherComponent,
    ConnectionIndicatorComponent,
    ResponsiveGateComponent,
  ],
  template: `
    <a class="crm-skip-link" href="#crm-main">{{ 'shell.skipToContent' | transloco }}</a>

    <div class="crm-shell">
      <header class="crm-shell__header">
        <div class="crm-shell__header-start">
          <crm-scope-switcher />
        </div>

        <div class="crm-shell__header-end">
          <crm-connection-indicator />
          <crm-language-switcher />
          <ng-content select="[shellHeaderEnd]" />
          <span class="crm-shell__user">{{ session.identity()?.displayName }}</span>
        </div>
      </header>

      <nav class="crm-shell__nav" [attr.aria-label]="'shell.navigation' | transloco">
        <ul>
          @for (item of navigation.visible(); track item.id) {
            <li>
              <a [routerLink]="item.route" routerLinkActive="is-active">
                {{ item.labelKey | transloco }}
              </a>

              @if (item.children?.length) {
                <ul>
                  @for (child of item.children; track child.id) {
                    <li>
                      <a [routerLink]="child.route" routerLinkActive="is-active">
                        {{ child.labelKey | transloco }}
                      </a>
                    </li>
                  }
                </ul>
              }
            </li>
          }
        </ul>
      </nav>

      <main id="crm-main" class="crm-shell__main" tabindex="-1">
        <crm-responsive-gate>
          <router-outlet />
        </crm-responsive-gate>
      </main>
    </div>
  `,
  styles: `
    .crm-shell {
      display: grid;
      grid-template-areas: 'header header' 'nav main';
      grid-template-columns: 16rem 1fr;
      grid-template-rows: auto 1fr;
      min-block-size: 100dvh;
    }

    .crm-shell__header {
      grid-area: header;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--crm-space-4);
      padding-inline: var(--crm-space-4);
      padding-block: var(--crm-space-3);
      border-block-end: 1px solid var(--crm-color-border);
    }

    .crm-shell__header-end {
      display: flex;
      align-items: center;
      gap: var(--crm-space-4);
    }

    .crm-shell__nav {
      grid-area: nav;
      padding: var(--crm-space-4);
      border-inline-end: 1px solid var(--crm-color-border);
    }

    .crm-shell__main {
      grid-area: main;
      padding: var(--crm-space-6);
    }

    /* Tablet: the sidebar collapses; operational routes stay usable (spec section 9.5). */
    @media (max-width: 63.99rem) {
      .crm-shell {
        grid-template-areas: 'header' 'main';
        grid-template-columns: 1fr;
      }

      .crm-shell__nav {
        display: none;
      }
    }

    .crm-skip-link {
      position: absolute;
      inset-block-start: -3rem;
      inset-inline-start: var(--crm-space-2);
      padding: var(--crm-space-2);
      background: var(--crm-color-surface);

      &:focus {
        inset-block-start: var(--crm-space-2);
      }
    }
  `,
})
export class AppShellComponent {
  protected readonly navigation = inject(NavigationService);
  protected readonly session = inject(SessionStore);
}
```

- [ ] **Step 7: Add the shell translation keys**

Extend `shell` in all four translation documents:

```json
{
  "shell": {
    "navigation": "Main navigation",
    "openOnLargerScreen": "This screen needs a larger display. Open it on a tablet or desktop.",
    "languageName": { "en": "English", "ar": "العربية" }
  }
}
```

```json
{
  "shell": {
    "navigation": "التنقل الرئيسي",
    "openOnLargerScreen": "تحتاج هذه الشاشة إلى عرض أكبر. افتحها على جهاز لوحي أو حاسوب مكتبي.",
    "languageName": { "en": "English", "ar": "العربية" }
  }
}
```

- [ ] **Step 8: Run the tests to verify they pass**

```bash
npx nx test shared-ui
npm run lint:styles
```

Expected: PASS — in particular that a dashboard route is not blocked on a phone while an operational route is.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(ui): add application shell with route-specific responsive policy

Navigation renders from the permission-filtered manifest. The responsive gate is
declared per route, so management dashboards stay usable on phones while
operational routes are not. The header projects a slot for the notification bell
without holding notification data. Spec sections 5.3, 6.3, 9.5."
```

**Completion criteria:** the shell renders filtered navigation; the language switcher writes the device preference; the responsive gate blocks only `operational` routes on phones; layout uses logical properties and collapses at tablet; a skip link and a labelled main region exist.

---

### Task 19: Agent application wiring

**Files:**
- Modify: `apps/agent-app/src/main.ts`
- Create: `apps/agent-app/src/app/app.config.ts`
- Create: `apps/agent-app/src/app/app.routes.ts`
- Create: `apps/agent-app/src/app/navigation.manifest.ts`
- Create: `apps/agent-app/src/app/landing.resolver.ts`, `landing.resolver.spec.ts`
- Create: `apps/agent-app/src/app/pages/forbidden.page.ts`, `not-found.page.ts`, `offline.page.ts`, `placeholder.page.ts`
- Modify: `apps/agent-app/src/app/app.component.ts`

**Interfaces:**
- Consumes: every `shared/*` provider function built in Tasks 2–18
- Produces: a booting agent application. No domain features.

- [ ] **Step 1: Write the failing test for landing resolution**

```ts
// apps/agent-app/src/app/landing.resolver.spec.ts
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { SessionStore } from '@crm/shared/auth';
import { resolveLandingRoute } from './landing.resolver';

describe('resolveLandingRoute', () => {
  let session: SessionStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    session = TestBed.inject(SessionStore);
  });

  const authorize = (...permissions: string[]) =>
    session.setIdentity({
      userId: 'u1', displayName: 'A', language: 'en',
      permissions: permissions.map((permission) => ({ permission, scope: 'all' as const })),
      departments: [], branches: [],
    });

  it('sends an operational user to the dashboard', () => {
    authorize('dashboard.view', 'ticket.view');
    expect(TestBed.runInInjectionContext(() => resolveLandingRoute())).toBe('/dashboard');
  });

  it('sends an administrator without dashboard access to user administration', () => {
    authorize('user.manage');
    expect(TestBed.runInInjectionContext(() => resolveLandingRoute())).toBe('/admin/users');
  });

  it('sends an auditor to the audit log', () => {
    authorize('audit.view');
    expect(TestBed.runInInjectionContext(() => resolveLandingRoute())).toBe('/admin/audit-log');
  });

  it('falls back to /403 rather than guessing when nothing is reachable', () => {
    authorize();
    expect(TestBed.runInInjectionContext(() => resolveLandingRoute())).toBe('/403');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx nx test agent-app
```

Expected: FAIL — `resolveLandingRoute` is not defined.

- [ ] **Step 3: Implement landing resolution**

```ts
// apps/agent-app/src/app/landing.resolver.ts
import { inject } from '@angular/core';
import { PermissionsService } from '@crm/shared/permissions';

/**
 * The landing route is RESOLVED after authentication rather than hard-coded, so
 * adding an actor does not require changing the root route (spec section 3).
 * Order is most-specific first.
 */
const LANDING_RULES: readonly { permission: string; route: string }[] = [
  { permission: 'dashboard.view', route: '/dashboard' },
  { permission: 'ticket.view', route: '/tickets' },
  { permission: 'user.manage', route: '/admin/users' },
  { permission: 'audit.view', route: '/admin/audit-log' },
  { permission: 'report.view', route: '/reports' },
];

export function resolveLandingRoute(): string {
  const permissions = inject(PermissionsService);
  const match = LANDING_RULES.find((rule) => permissions.has(rule.permission));
  // No guessing: a principal with nothing reachable is told so explicitly.
  return match?.route ?? '/403';
}
```

- [ ] **Step 4: Write the routes**

Phase 0 has no domain features, so each domain route points at a placeholder page. The route tree, its guards, and its responsive policies are real; only the page content is a stand-in until its phase arrives.

```ts
// apps/agent-app/src/app/pages/placeholder.page.ts
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { EmptyStateComponent } from '@crm/shared/ui';

/** Stand-in until the owning phase builds the feature. Carries no domain logic. */
@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EmptyStateComponent],
  template: `<crm-empty-state titleKey="state.empty" />`,
})
export class PlaceholderPage {
  readonly title = input('');
}
```

```ts
// apps/agent-app/src/app/app.routes.ts
import { inject } from '@angular/core';
import { Route, Router } from '@angular/router';
import { authenticatedGuard } from '@crm/shared/auth';
import { requirePermission } from '@crm/shared/permissions';
import { resolveLandingRoute } from './landing.resolver';

const placeholder = () => import('./pages/placeholder.page').then((m) => m.PlaceholderPage);

export const appRoutes: Route[] = [
  {
    path: 'auth/login',
    loadComponent: () => import('./pages/login.page').then((m) => m.LoginPage),
  },

  {
    path: '',
    canMatch: [authenticatedGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        canMatch: [() => inject(Router).parseUrl(resolveLandingRoute())],
        loadComponent: placeholder,
      },

      // --- operational routes: desktop-first, tablet usable, phone unsupported ---
      {
        path: 'tickets',
        data: { responsive: 'operational' },
        canMatch: [requirePermission('ticket.view')],
        loadComponent: placeholder,
      },
      {
        path: 'customers',
        data: { responsive: 'operational' },
        canMatch: [requirePermission('customer.view')],
        loadComponent: placeholder,
      },
      {
        path: 'kb',
        data: { responsive: 'operational' },
        canMatch: [requirePermission('kb.view')],
        loadComponent: placeholder,
      },
      {
        path: 'admin',
        data: { responsive: 'operational' },
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'users' },
          { path: 'users', canMatch: [requirePermission('user.manage')], loadComponent: placeholder },
          { path: 'roles', canMatch: [requirePermission('role.manage')], loadComponent: placeholder },
          { path: 'departments', canMatch: [requirePermission('org.manage')], loadComponent: placeholder },
          { path: 'branches', canMatch: [requirePermission('org.manage')], loadComponent: placeholder },
          { path: 'sla', canMatch: [requirePermission('sla.manage')], loadComponent: placeholder },
          { path: 'escalation', canMatch: [requirePermission('sla.manage')], loadComponent: placeholder },
          { path: 'channels', canMatch: [requirePermission('channel.manage')], loadComponent: placeholder },
          { path: 'integrations', canMatch: [requirePermission('integration.manage')], loadComponent: placeholder },
          { path: 'audit-log', canMatch: [requirePermission('audit.view')], loadComponent: placeholder },
        ],
      },

      // --- dashboard and KPI routes: responsive on phones ---
      {
        path: 'dashboard',
        data: { responsive: 'dashboard' },
        canMatch: [requirePermission('dashboard.view')],
        loadComponent: placeholder,
      },
      {
        path: 'reports',
        data: { responsive: 'dashboard' },
        canMatch: [requirePermission('report.view')],
        loadComponent: placeholder,
      },

      // --- own-data routes: no permission required ---
      { path: 'notifications', loadComponent: placeholder },
      { path: 'settings/profile', loadComponent: placeholder },
    ],
  },

  { path: '403', loadComponent: () => import('./pages/forbidden.page').then((m) => m.ForbiddenPage) },
  { path: 'offline', loadComponent: () => import('./pages/offline.page').then((m) => m.OfflinePage) },
  { path: '**', loadComponent: () => import('./pages/not-found.page').then((m) => m.NotFoundPage) },
];
```

`/inbox` is deliberately absent: whether agents work channels through a unified inbox or through ticket threads is unresolved (spec section 5.4). Do not add it.

- [ ] **Step 5: Write the navigation manifest**

```ts
// apps/agent-app/src/app/navigation.manifest.ts
import type { NavItem } from '@crm/shared/permissions';

/**
 * PROVISIONAL permission names (open question P1). The manifest and the route
 * guards must always name the same permission — that is what guarantees a menu
 * entry cannot point at an unreachable route (spec section 6.3).
 */
export const AGENT_NAVIGATION: readonly NavItem[] = [
  { id: 'dashboard', labelKey: 'nav.dashboard', route: '/dashboard', icon: 'home', permission: 'dashboard.view' },
  { id: 'tickets', labelKey: 'nav.tickets', route: '/tickets', icon: 'inbox', permission: 'ticket.view' },
  { id: 'customers', labelKey: 'nav.customers', route: '/customers', icon: 'users', permission: 'customer.view' },
  { id: 'kb', labelKey: 'nav.kb', route: '/kb', icon: 'book', permission: 'kb.view' },
  { id: 'reports', labelKey: 'nav.reports', route: '/reports', icon: 'chart', permission: 'report.view' },
  {
    id: 'admin', labelKey: 'nav.admin', route: '/admin', icon: 'cog',
    children: [
      { id: 'users', labelKey: 'nav.users', route: '/admin/users', icon: 'user', permission: 'user.manage' },
      { id: 'roles', labelKey: 'nav.roles', route: '/admin/roles', icon: 'key', permission: 'role.manage' },
      { id: 'departments', labelKey: 'nav.departments', route: '/admin/departments', icon: 'sitemap', permission: 'org.manage' },
      { id: 'branches', labelKey: 'nav.branches', route: '/admin/branches', icon: 'map', permission: 'org.manage' },
      { id: 'sla', labelKey: 'nav.sla', route: '/admin/sla', icon: 'clock', permission: 'sla.manage' },
      { id: 'escalation', labelKey: 'nav.escalation', route: '/admin/escalation', icon: 'arrow-up', permission: 'sla.manage' },
      { id: 'channels', labelKey: 'nav.channels', route: '/admin/channels', icon: 'share', permission: 'channel.manage' },
      { id: 'integrations', labelKey: 'nav.integrations', route: '/admin/integrations', icon: 'plug', permission: 'integration.manage' },
      { id: 'audit', labelKey: 'nav.audit', route: '/admin/audit-log', icon: 'list', permission: 'audit.view' },
    ],
  },
  { id: 'notifications', labelKey: 'nav.notifications', route: '/notifications', icon: 'bell' },
];
```

Add the matching `nav.*` keys to `apps/agent-app/public/i18n/en.json` and `ar.json`.

- [ ] **Step 6: Compose the application**

```ts
// apps/agent-app/src/app/app.config.ts
import { ApplicationConfig, inject, provideAppInitializer } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideAppConfig, type AppConfig as RuntimeConfig } from '@crm/shared/config';
import { provideHttpInfrastructure } from '@crm/shared/http';
import {
  LanguageResolver,
  provideAppDirection,
  provideAppTranslation,
  provideLocalePreference,
} from '@crm/shared/i18n';
import { DevSessionStrategy, provideSession } from '@crm/shared/auth';
import { NavigationService, provideActiveScope } from '@crm/shared/permissions';
import { provideObservability } from '@crm/shared/observability';
import { provideRealtime } from '@crm/shared/realtime';
import { provideCrmTheme } from '@crm/shared/ui';
import { appRoutes } from './app.routes';
import { AGENT_NAVIGATION } from './navigation.manifest';

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
      provideActiveScope(),
      provideObservability(),
      provideRealtime(),
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
```

```ts
// apps/agent-app/src/main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { loadAppConfig } from '@crm/shared/config';
import { AppComponent } from './app/app.component';
import { buildAppConfig } from './app/app.config';

loadAppConfig()
  .then((runtime) => bootstrapApplication(AppComponent, buildAppConfig(runtime)))
  .catch((error) => {
    // Configuration failure is fatal and must be visible, not silent.
    console.error('Application configuration failed to load.', error);
    document.body.textContent = 'Application configuration failed to load.';
  });
```

```ts
// apps/agent-app/src/app/app.component.ts
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AppShellComponent } from '@crm/shared/ui';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppShellComponent],
  template: `<crm-app-shell />`,
})
export class AppComponent {}
```

- [ ] **Step 7: Write the error pages**

```ts
// apps/agent-app/src/app/pages/forbidden.page.ts
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { EmptyStateComponent } from '@crm/shared/ui';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EmptyStateComponent],
  template: `<crm-empty-state titleKey="errors.forbidden" />`,
})
export class ForbiddenPage {}
```

Write `not-found.page.ts` with `titleKey="errors.notFound"`, `offline.page.ts` with `titleKey="errors.offline"`, and a minimal `login.page.ts` that calls `SESSION_STRATEGY.login()` and navigates to `returnTo`.

- [ ] **Step 8: Run tests, lint, and build**

```bash
npx nx test agent-app
npx nx lint agent-app
npx nx build agent-app
```

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(agent-app): wire the agent application shell and route tree

Composes every shared provider, resolves the landing route from permissions
rather than hard-coding it, and declares the full route tree with guards and
per-route responsive policy. Domain routes render placeholders; /inbox is
deliberately absent pending the omnichannel decision. Spec sections 3, 5.1, 5.4."
```

**Completion criteria:** the application boots; landing resolves per permission and falls back to `/403` rather than guessing; every route in spec section 5.1 exists with its guard; `/inbox` is absent; no domain logic is present.

---

### Task 20: Portal application wiring

**Files:**
- Modify: `apps/portal-app/src/main.ts`, `src/app/app.component.ts`
- Create: `apps/portal-app/src/app/app.config.ts`, `app.routes.ts`, `navigation.manifest.ts`
- Create: `apps/portal-app/src/app/pages/` — the same placeholder and error pages

**Interfaces:**
- Consumes: the same shared providers
- Produces: a booting portal application, mobile-first, with no agent code in its bundle

- [ ] **Step 1: Write the failing test for bundle separation**

```ts
// apps/portal-app/src/app/app.routes.spec.ts
import { describe, expect, it } from 'vitest';
import { portalRoutes } from './app.routes';

const paths = (routes: typeof portalRoutes): string[] =>
  routes.flatMap((route) => [route.path ?? '', ...paths(route.children ?? [])]);

describe('portalRoutes', () => {
  it('redirects the root to the customer landing route', () => {
    const root = portalRoutes.find((route) => route.path === '');
    expect(root?.redirectTo).toBe('/tickets');
  });

  it('declares exactly the portal surface from the spec', () => {
    expect(paths(portalRoutes).filter(Boolean).sort()).toEqual(
      ['**', 'auth/forgot-password', 'auth/login', 'auth/register', 'chat', 'kb', 'kb/:slug', 'profile', 'tickets', 'tickets/:id', 'tickets/new'].sort(),
    );
  });

  it('contains no agent or administrative route', () => {
    const agentSurface = ['admin', 'reports', 'customers', 'dashboard', 'notifications'];
    for (const path of paths(portalRoutes)) {
      expect(agentSurface).not.toContain(path);
    }
  });

  it('declares every route mobile-first', () => {
    const declared = portalRoutes.flatMap((route) => [route, ...(route.children ?? [])]);
    const operational = declared.filter((route) => route.data?.['responsive'] === 'operational');
    expect(operational).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx nx test portal-app
```

Expected: FAIL — `portalRoutes` is not defined.

- [ ] **Step 3: Implement the portal routes**

```ts
// apps/portal-app/src/app/app.routes.ts
import { Route } from '@angular/router';
import { authenticatedGuard } from '@crm/shared/auth';

const placeholder = () => import('./pages/placeholder.page').then((m) => m.PlaceholderPage);

/**
 * Customer surface only. Mobile-first throughout (spec section 9.5): no route
 * declares the `operational` policy, so nothing is ever blocked on a phone.
 *
 * Self-registration is included pending open question on portal authentication;
 * if registration is not permitted, remove the route rather than hiding it.
 */
export const portalRoutes: Route[] = [
  { path: '', pathMatch: 'full', redirectTo: '/tickets' },

  { path: 'auth/login', loadComponent: () => import('./pages/login.page').then((m) => m.LoginPage) },
  { path: 'auth/register', loadComponent: placeholder },
  { path: 'auth/forgot-password', loadComponent: placeholder },

  { path: 'kb', data: { responsive: 'portal' }, loadComponent: placeholder },
  { path: 'kb/:slug', data: { responsive: 'portal' }, loadComponent: placeholder },

  {
    path: '',
    canMatch: [authenticatedGuard],
    data: { responsive: 'portal' },
    children: [
      { path: 'tickets', loadComponent: placeholder },
      { path: 'tickets/new', loadComponent: placeholder },
      { path: 'tickets/:id', loadComponent: placeholder },
      { path: 'chat', loadComponent: placeholder },
      { path: 'profile', loadComponent: placeholder },
    ],
  },

  { path: '**', loadComponent: () => import('./pages/not-found.page').then((m) => m.NotFoundPage) },
];
```

- [ ] **Step 4: Write the portal navigation manifest and application config**

```ts
// apps/portal-app/src/app/navigation.manifest.ts
import type { NavItem } from '@crm/shared/permissions';

/** Customers have no permission-gated navigation: every entry is own-data. */
export const PORTAL_NAVIGATION: readonly NavItem[] = [
  { id: 'tickets', labelKey: 'nav.myTickets', route: '/tickets', icon: 'inbox' },
  { id: 'new', labelKey: 'nav.newTicket', route: '/tickets/new', icon: 'plus' },
  { id: 'kb', labelKey: 'nav.help', route: '/kb', icon: 'book' },
  { id: 'chat', labelKey: 'nav.chat', route: '/chat', icon: 'message' },
];
```

Copy `apps/agent-app/src/app/app.config.ts` to the portal, replacing `appRoutes` with `portalRoutes` and `AGENT_NAVIGATION` with `PORTAL_NAVIGATION`. Copy `main.ts` unchanged except for the component import.

- [ ] **Step 5: Verify the scope boundary is enforced**

Temporarily add `import { AGENT_NAVIGATION } from '../../../agent-app/src/app/navigation.manifest';` to a portal file and run:

```bash
npx nx lint portal-app
```

Expected: FAIL on `@nx/enforce-module-boundaries` — `scope:portal` cannot depend on `scope:agent`. Remove the import and re-run; expected: PASS. This proves the agent/customer separation from spec section 4.3 is mechanically enforced, not merely intended.

- [ ] **Step 6: Run tests, lint, and build**

```bash
npx nx test portal-app
npx nx lint portal-app
npx nx build portal-app
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(portal-app): wire the customer portal shell and route tree

Customer surface only, mobile-first throughout, with the root redirecting to
/tickets. A portal file importing agent code fails lint, so the trust boundary
is mechanically enforced rather than intended. Spec sections 4.3, 5.2, 9.5."
```

**Completion criteria:** the portal boots; `/` redirects to `/tickets`; the route set matches spec section 5.2 exactly; no agent route is present; importing agent code fails lint; no route declares the `operational` policy.

---

### Task 21: Phase 0 acceptance and CI

The acceptance criterion from spec section 12.1 is: both applications boot to an authenticated, translated, direction-correct empty shell in Arabic and English. This task proves it end to end and locks the CI gate.

**Files:**
- Create: `apps/agent-app-e2e/src/phase-0-acceptance.spec.ts`
- Create: `apps/portal-app-e2e/src/phase-0-acceptance.spec.ts`
- Create: `.github/workflows/ci.yml`
- Modify: `apps/agent-app/project.json`, `apps/portal-app/project.json` (mock serve target)
- Create: `docs/superpowers/plans/phase-0-completion.md`

**Interfaces:**
- Consumes: everything
- Produces: a green CI pipeline and a recorded Phase 0 completion report

- [ ] **Step 1: Write the failing acceptance test**

```ts
// apps/agent-app-e2e/src/phase-0-acceptance.spec.ts
import { expect, test } from '@playwright/test';

test.describe('Phase 0 acceptance — agent application', () => {
  test('boots to an authenticated shell in English, left-to-right', async ({ page }) => {
    await page.goto('/');

    const html = page.locator('html');
    await expect(html).toHaveAttribute('lang', 'en');
    await expect(html).toHaveAttribute('dir', 'ltr');

    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
    await expect(page.getByText('Test Agent')).toBeVisible();
  });

  test('switches to Arabic and flips direction without a reload', async ({ page }) => {
    await page.goto('/');

    const navigationId = await page.evaluate(() => {
      (window as unknown as { __marker: number }).__marker = 42;
      return 42;
    });

    await page.getByLabel('Language').selectOption('ar');

    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');

    // Proves it was a runtime switch, not a navigation.
    const survived = await page.evaluate(() => (window as unknown as { __marker?: number }).__marker);
    expect(survived).toBe(navigationId);
  });

  test('renders navigation translated into Arabic', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Language').selectOption('ar');
    await expect(page.getByRole('navigation', { name: 'التنقل الرئيسي' })).toBeVisible();
  });

  test('routes an unheld permission to 403 rather than redirecting silently', async ({ page }) => {
    await page.goto('/admin/sla');
    await expect(page).toHaveURL(/\/403$/);
  });

  test('keeps the language choice across a reload as a device preference', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Language').selectOption('ar');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
  });

  test('blocks an operational route on a phone but not a dashboard route', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto('/tickets');
    await expect(page.getByTestId('small-screen-notice')).toBeVisible();

    await page.goto('/dashboard');
    await expect(page.getByTestId('small-screen-notice')).toHaveCount(0);
  });
});
```

```ts
// apps/portal-app-e2e/src/phase-0-acceptance.spec.ts
import { expect, test } from '@playwright/test';

test.describe('Phase 0 acceptance — customer portal', () => {
  test('redirects the root to the customer landing route', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/tickets$/);
  });

  test('boots translated and direction-correct in Arabic', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Language').selectOption('ar');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  });

  test('is usable on a phone viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/tickets');
    await expect(page.getByTestId('small-screen-notice')).toHaveCount(0);
  });
});
```

- [ ] **Step 2: Add the mock serve target**

Add to both `project.json` files, so E2E runs against MSW handlers rather than a backend that does not exist:

```json
{
  "targets": {
    "serve-mock": {
      "executor": "@angular-devkit/build-angular:dev-server",
      "options": { "buildTarget": "agent-app:build:development", "port": 4200 },
      "configurations": { "mock": {} }
    }
  }
}
```

Start the MSW browser worker in `main.ts` when the runtime config says so:

```ts
// apps/agent-app/src/main.ts  (extended)
async function startMocks(): Promise<void> {
  // isDevMode(), not import.meta.env — Angular's build does not guarantee Vite's
  // import.meta.env, and a mock layer that silently fails to start is worse than
  // one that never existed.
  if (!isDevMode()) {
    return;
  }
  const { worker } = await import('@crm/shared/testing/browser');
  await worker.start({ onUnhandledRequest: 'bypass' });
}

startMocks()
  .then(() => loadAppConfig())
  .then((runtime) => bootstrapApplication(AppComponent, buildAppConfig(runtime)))
  .catch((error) => {
    console.error('Application configuration failed to load.', error);
    document.body.textContent = 'Application configuration failed to load.';
  });
```

Add the browser worker as a second entry point of `shared/testing`, so the node-only MSW server never reaches a browser bundle:

```ts
// libs/shared/testing/src/browser.ts
import { setupWorker } from 'msw/browser';
import { handlers } from './lib/handlers';

export const worker = setupWorker(...handlers);
```

Map the entry point in `tsconfig.base.json` alongside the main one:

```json
{
  "compilerOptions": {
    "paths": {
      "@crm/shared/testing": ["libs/shared/testing/src/index.ts"],
      "@crm/shared/testing/browser": ["libs/shared/testing/src/browser.ts"]
    }
  }
}
```

Generate the service worker MSW needs:

```bash
npx msw init apps/agent-app/public --save
npx msw init apps/portal-app/public --save
```

- [ ] **Step 3: Run the acceptance tests to verify they fail or pass honestly**

```bash
npx nx e2e agent-app-e2e
npx nx e2e portal-app-e2e
```

Fix whatever genuinely fails. Do not weaken an assertion to make it pass — each one restates an explicit spec requirement.

- [ ] **Step 4: Write the CI pipeline**

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-node@v4
        with:
          node-version: lts/*
          cache: npm

      - run: npm ci
      - run: npx playwright install --with-deps chromium

      - name: Derive the affected range
        uses: nrwl/nx-set-shas@v4

      - name: Lint (TypeScript, module boundaries, PrimeNG restriction)
        run: npx nx affected -t lint

      - name: Lint styles (logical properties)
        run: npm run lint:styles

      - name: Unit and component tests
        run: npx nx affected -t test --configuration=ci

      - name: Build
        run: npx nx affected -t build

      - name: End-to-end (both locales and directions)
        run: npx nx affected -t e2e

      # Bundle budgets are NOT gated yet. They are baselined after Phase 0 and
      # the first production-like feature, then enabled (spec section 10.6).
      - name: Record bundle sizes for baselining
        run: |
          echo "## Bundle sizes (informational, not gated)" >> "$GITHUB_STEP_SUMMARY"
          du -sh dist/apps/*/browser 2>/dev/null >> "$GITHUB_STEP_SUMMARY" || true
```

- [ ] **Step 5: Run the whole pipeline locally**

```bash
npx nx run-many -t lint test build
npm run lint:styles
npx nx run-many -t e2e
```

Expected: all PASS.

- [ ] **Step 6: Write the completion report**

```markdown
<!-- docs/superpowers/plans/phase-0-completion.md -->
# Phase 0 Completion Report

## Delivered (spec section 12.1)
- [ ] Nx workspace, both application shells, tag rules, library generators
- [ ] shared/http — interceptor chain and opt-in scope policy
- [ ] shared/auth — pluggable session abstraction with a development implementation
- [ ] shared/permissions — engine, canMatch guard, directive, navigation manifest
- [ ] shared/i18n — Transloco with ICU, locale formatting, DirectionService
- [ ] shared/realtime — connection manager with reconnect and resubscription
- [ ] shared/observability — abstraction with a no-op implementation
- [ ] shared/config — runtime configuration loader
- [ ] shared/ui — foundational primitives, tokens, theme, application shell
- [ ] shared/testing — MSW harness and fixtures
- [ ] Error handling, draft canonical OpenAPI, CI pipeline
- [ ] Both applications boot authenticated, translated, direction-correct in ar and en

## Deliberately not built
DataTable, SlaClock, RichTextEditor, Timeline, DateRangePicker, and comparable
domain-driven components. Each is created by the phase whose domain first needs it.

## Open questions still outstanding
Record the current status of B1–B4, P1–P3, and U1–U8 from spec section 13,
noting which were resolved during Phase 0 and which remain.

## Measured bundle sizes
Record the agent and portal initial bundle sizes here. These become the baseline
from which spec section 10.6's CI budgets are finalized after the first
production-like feature.
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "test(e2e): add Phase 0 acceptance suite and CI pipeline

Proves both applications boot authenticated, translated, and direction-correct
in Arabic and English, that a language switch is a runtime switch rather than a
navigation, that an unheld permission routes to /403, and that the responsive
policy is route-specific. Bundle budgets are recorded but not gated, pending
baselining. Spec sections 10.6, 11, 12.1."
```

**Completion criteria:** every acceptance test passes without weakened assertions; CI runs lint, style lint, tests, builds, and E2E on the affected graph; bundle sizes are recorded for baselining but not gated; the completion report captures outstanding open questions.

---

## Phase 0 Definition of Done

Phase 0 is complete when all of the following hold:

1. Both applications boot to an authenticated, translated, direction-correct empty shell in Arabic and English.
2. A cross-feature import, a cross-scope import, and a `primeng/*` import outside `shared/ui` each fail lint.
3. A physical CSS property fails stylelint; a described disable passes; a descriptionless one fails.
4. Every failure reaching a caller is an `AppError`; ordinary `4xx` responses are never retried.
5. Scope is attached only to requests that opt in.
6. The server language preference never writes to device storage and never survives logout.
7. A non-allowlisted telemetry field is dropped and warned about.
8. Realtime reconnect resubscribes and announces exactly the topics that were active.
9. No domain functionality and no deferred component exists anywhere in the tree.
10. The full CI pipeline is green.

**What Phase 0 does not settle:** every item in spec section 13 that is still open, and every business rule belonging to a later phase. Phase 1 (`tickets/*`, `customers/*`) begins only after its own brainstorm → spec → plan cycle.
