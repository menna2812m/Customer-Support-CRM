# Phase 0 Completion Report

Recorded 2026-08-25, against the plan `2026-08-24-phase-0-platform-foundation.md` as amended by
spec section 12.2 (scope amendment approved 2026-08-25).

## Delivered (spec section 12.1, as amended)

- [x] Nx workspace, both application shells, tag rules, library generators
- [x] `shared/config` — runtime configuration loader, secrets rejected before bootstrap
- [x] `shared/testing` — MSW harness, fixtures, and contract validation; draft canonical OpenAPI
- [x] `shared/http` — `AppError`, interceptor chain, request identity, transient-only retry, and the
      opt-in scope policy (mechanism only — see below)
- [x] `shared/i18n` — Transloco with ICU and lazy scopes, locale formatting, `DirectionService`,
      device-versus-server language resolution
- [x] `shared/auth` — pluggable session abstraction with a development implementation and guard
- [x] `shared/permissions` — engine, `canMatch` guard, `appHasPermission` directive, navigation
      manifest
- [x] `shared/observability` — allowlisted telemetry, global error handler, no-op client
- [x] `shared/ui` — design tokens, bilingual typography, token-driven PrimeNG theme, primitives,
      overlay services, state components, application shell
- [x] Agent application boots authenticated, translated, and direction-correct in Arabic and English
- [x] CI pipeline: lint, style lint, bidi lint, unit tests, builds, and end-to-end on the affected
      graph

## Deferred out of Phase 0 by the 2026-08-25 scope amendment

Recorded in spec section 12.2. The reduced Phase 0 is narrower than section 12.1 describes.

| Deferred | Moved to | Consequence carried forward |
|---|---|---|
| `shared/realtime` | Phase 2 (omnichannel) | No push updates. Anything needing live data polls. The shell has no connection indicator |
| `portal-app` wiring and its acceptance suite | Phase 4 (customer portal) | The portal still renders the Nx welcome page. Its `scope:portal` lint boundary is enforced and unaffected |
| `DrawerService` | First tablet-panel consumer | Tablet layout collapses the sidebar with CSS; nothing opens as an edge panel yet |
| `ScopeContextService` + scope switcher | Front of Phase 1, gated on B1 | `ACTIVE_SCOPE_PROVIDER` keeps its no-op default, so **no request carries scope parameters**. The `HttpContext` opt-in mechanism exists and is tested; only the provider is absent |

## Deliberately not built

`DataTable`, `SlaClock`, `RichTextEditor`, `Timeline`, `DateRangePicker`, and comparable
domain-driven components. Each is created by the phase whose domain first needs it, so its API is
shaped by a real use case rather than speculation (spec section 12.1).

## Deviations from the written plan

Each was made because following the plan literally would have produced something that did not work
or shipped something that should not ship. All are recorded in the commit that made them.

| Task | Deviation | Why |
|---|---|---|
| 15 | Preset rewritten against `@primeuix/themes` v3 | The plan's snippet targets an older API: v3 has no `semantic.colorScheme` and no `semantic.borderRadius`, so those keys would have been inert. Overriding only the role keys would also have left Aura's `primary.*` and `surface.*` ramps — 86 and 338 component references — resolving to emerald and slate. Both ramps are now derived from the role tokens |
| 15 | `no-restricted-imports` re-declared in `shared/ui` rather than switched off | Lifting the PrimeNG restriction must not also lift the `msw/node` restriction in a library that ships to the browser |
| 16 | Form field reads `control.events` instead of `control.invalid` inside a `computed` | `AbstractControl` exposes validity and touched as plain properties, so the computed memoised on first read and the error never appeared. Caught by two of the plan's own tests |
| 18 | No scope switcher, no connection indicator | Both deferred (above) |
| 19 | No `provideActiveScope()`, no `provideRealtime()` | Both deferred (above) |
| 21 | MSW start module replaced at build time via `fileReplacements` instead of gated on `isDevMode()` | The `isDevMode()` gate still emitted the handlers, and the fixture identity inside them, as a 175 kB lazy chunk of the production bundle — never requested, but shipped |
| 21 | Playwright `webServer` command indirected through an npm script | A bare `nx run <app>:serve` is inferred by the `@nx/playwright` plugin as a dependency of the e2e target *and* run again by Playwright, which Nx aborts as a recursive task invocation |
| 21 | CI installs chromium, firefox, and webkit | B3 resolved the supported matrix as the latest two majors of Chrome, Edge, Firefox, and Safari. An acceptance suite that only runs on Blink cannot speak to three quarters of it |
| 21 | `nx affected -t test`, not `--configuration=ci` | No `ci` configuration exists on the test targets in this workspace |

## A behaviour worth a decision

The acceptance suite pins this rather than asserting the opposite, because the spec is explicit —
but it is a product question, not a settled one.

**An explicit language switch does not survive a reload for an authenticated user.** Spec section 9.3
states that the device preference is an unauthenticated default and *the server preference always
wins once a user is authenticated*. So an agent who switches to Arabic sees English again after a
refresh, because `GET /me` still reports `en`. The choice is remembered on the device and applies
before authentication and after logout — but not during the session that made it.

Making the switch stick requires an endpoint that updates the authenticated user's language
preference, which does not exist in the draft contract. That is a contract change (B4: jointly owned,
by pull request), so it is recorded here rather than worked around.

## Open questions — status at the end of Phase 0

### Hard blockers (spec section 13.1)

| # | Status |
|---|---|
| B1 | **Still open.** Department and branch relationship. Blocks `ScopeContextService`, the scope switcher, and the shape of every scoped query. Now at the front of Phase 1 |
| B2 | **Resolved 2026-08-25.** Temporary neutral semantic tokens; no invented branding. Delivered in `libs/shared/ui/src/styles/_tokens.scss`; the PrimeNG theme is generated from it |
| B3 | **Resolved 2026-08-25.** Latest 2 majors of Chrome, Edge, Firefox, Safari. The acceptance suite runs on Chromium, Firefox, and WebKit |
| B4 | **Resolved 2026-08-24.** `docs/api/openapi.yaml`, jointly owned, changed by pull request |

### May remain open through Phase 0 (spec section 13.2)

| # | Status |
|---|---|
| P1 | **Still open.** Permission catalogue. Every permission name in the navigation manifest, the route guards, the landing rules, and the development fixtures is provisional. Must be resolved before any permission-sensitive domain work |
| P2 | **Still open.** Telemetry vendor and data residency. `shared/observability` ships the no-op client and the allowlist; no vendor is wired |
| P3 | **Still open.** Display timezone policy. UTC ISO-8601 holds as the API and internal invariant |

### Cross-cutting, unconfirmed (spec section 13.4)

U1–U8 are all **unchanged and still unconfirmed**. U1 (authentication mechanism) is the one Phase 0
directly accommodated: `shared/auth` is pluggable specifically so the answer can arrive later, and
`DevSessionStrategy` is the only implementation.

### Subsystem blockers (spec section 13.3)

Unchanged. In particular, the omnichannel question — unified inbox versus channel messages inside
tickets — remains undecided, and `/inbox` is deliberately absent from the agent route tree.

## Measured bundle sizes

Production builds, 2026-08-25. **Informational baseline, not gated** (spec section 10.6).

| Application | Initial raw | Initial transfer | `dist/.../browser` on disk |
|---|---|---|---|
| agent-app | 699.31 kB | 160.35 kB | 741 KB |
| portal-app (unwired, Nx welcome page) | 222.24 kB | 60.40 kB | 249 KB |

The agent application exceeds Nx's default 500 kB *warning* budget (error budget: 1 MB), so its
build warns. PrimeNG and the ICU message formatter account for the difference. The budget has not
been raised: these numbers are the baseline from which section 10.6's real budgets are set after the
first production-like feature, and silently widening a budget to hide the number it is meant to
measure would defeat the exercise. The portal number will change entirely once Phase 4 wires it.

## Phase 0 Definition of Done — verification

| # | Criterion | Status |
|---|---|---|
| 1 | Both applications boot authenticated, translated, direction-correct in ar and en | **Agent: yes**, verified by the acceptance suite on three engines. **Portal: deferred** by the scope amendment |
| 2 | Cross-feature, cross-scope, and `primeng/*` imports each fail lint | Yes. The PrimeNG boundary was re-verified with a deliberate violation during Task 15 |
| 3 | A physical CSS property fails stylelint; a described disable passes; a descriptionless one fails | Yes, all three verified during Task 15 |
| 4 | Every failure reaching a caller is an `AppError`; ordinary 4xx is never retried | Yes (Task 4) |
| 5 | Scope is attached only to requests that opt in | Mechanism yes; **no request carries scope at all**, because the provider is deferred |
| 6 | The server language preference never writes to device storage and never survives logout | Yes (Task 8) |
| 7 | A non-allowlisted telemetry field is dropped and warned about | Yes (Task 13) |
| 8 | Realtime reconnect resubscribes to exactly the active topics | **Not applicable** — realtime is deferred |
| 9 | No domain functionality and no deferred component exists anywhere in the tree | Yes. Domain routes render a placeholder empty state |
| 10 | The full CI pipeline is green | Yes, verified locally: `nx run-many -t lint test build`, `lint:styles`, `lint:bidi`, and `nx run-many -t e2e` all pass |

## Next step

Phase 1 (`tickets/*`, `customers/*`) begins with its own brainstorm → spec → plan cycle, and starts
with B1 and the deferred `ScopeContextService`, since ticket queues are the first genuinely scoped
queries.
