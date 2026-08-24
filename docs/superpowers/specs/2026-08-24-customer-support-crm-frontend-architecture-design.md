# Customer Support CRM — Frontend Architecture Design

- **Status:** Approved (design). Implementation plan not yet written.
- **Date:** 2026-08-24
- **Scope:** System-wide frontend architecture. Per-subsystem specs follow separately.
- **Stack:** Angular (standalone APIs, Signals), TypeScript, RxJS, Nx, PrimeNG, Transloco, NgRx SignalStore.

---

## 1. Purpose and document scope

This document defines the frontend architecture for a Customer Support CRM: how the codebase is
divided, how actors reach functionality, how permissions are enforced, how state and server data
are managed, how Arabic/English and RTL/LTR are handled, and which cross-cutting concerns every
feature must satisfy.

It deliberately does **not** specify feature behavior. The product spans ten largely independent
subsystems; specifying all of them here would produce a document too vague to implement. Each
subsystem gets its own brainstorm → spec → plan cycle. This document is the contract those specs
share.

Where a business rule was not supplied, it is recorded in the open-questions register (section 13) rather
than invented.

### 1.1 Subsystem decomposition

| # | Subsystem | Independence rationale |
|---|---|---|
| 0 | **Platform foundation** | Everything depends on it; it depends on nothing |
| 1 | Agent workspace — tickets, customers, agent dashboard | The daily driver |
| 2 | Omnichannel — email, WhatsApp, live chat, SMS, web form | Realtime transport + per-channel adapters |
| 3 | SLA, escalation, notifications, reminders | Own rules surface; cross-cuts tickets |
| 4 | Knowledge base | Authoring workflow + search; agent-side and public |
| 5 | Customer portal | Different actor, different auth, separate application |
| 6 | Admin & governance — users, roles, permissions, audit, departments, branches | Own lifecycle |
| 7 | Reports & management dashboards | Read-heavy, visualization-heavy, different perf profile |
| 8 | AI assist — summaries, suggested replies, categorization, suggested solutions, chatbot | Isolated, optional, non-blocking |
| 9 | Integrations / external API console | Own surface |

Build order is defined in section 12.

---

## 2. Decision ledger

Decisions locked during design. Each is binding on all subsystem specs.

| Area | Decision |
|---|---|
| Spec strategy | One system-wide architecture spec (this document), then per-subsystem specs |
| Backend | Does not exist yet; built in parallel. The frontend **defines** its required contract and ships a mock layer so it is never blocked |
| Topology | Nx monorepo, two applications (`agent-app`, `portal-app`), shared libraries |
| Slicing | Domain-sliced libraries with enforced tag rules; libraries created lazily as subsystems are built |
| Permissions | Named permissions × data scope. **Backend authorization is authoritative; frontend checks are UX only** |
| i18n | Transloco runtime translation; per-user server-side language preference; ICU pluralization; per-message direction for user content |
| Locale rules | No Hijri calendar. No Arabic-Indic numerals. (Both may be revisited; neither is a current requirement) |
| Realtime | One multiplexed socket per app session: chat, ticket events, notifications. Dashboards poll |
| UI library | PrimeNG, consumed only through the `shared/ui` boundary |
| Devices | Route-specific responsive policy (section 9.5) |
| Scale target | 50–200 agents, thousands of tickets/month, single tenant. **Not** multi-tenant SaaS |
| Auth | Pluggable session abstraction; transport mechanism undecided |
| AI | Request/response (no streaming), human-in-the-loop, non-blocking, degrades quietly |
| State | Signals + RxJS by default; NgRx SignalStore only for cross-feature server state (section 7.1) |
| Testing | Unit + component required; Playwright E2E on critical paths in both locales/directions |

### 2.1 Explicit non-goals

- **Multi-tenancy.** Single organization. Department and branch scoping is not tenancy.
- **Module federation / micro-frontends.** Rejected as unjustified at this scale (section 4.4).
- **Streaming AI responses.** Request/response only.
- **Agent workspace on phones.** Out of scope for operational routes (section 9.5).
- **Offline-first operation.** Not a requirement. Reconnect handling only (section 8.7).

---

## 3. Actors

Confirmed actors:

| Actor | Application | Landing route | Notes |
|---|---|---|---|
| Agent | agent-app | `/dashboard` | Own queue, own SLA clocks |
| Supervisor | agent-app | `/dashboard` | Team queue, escalations |
| Department Manager | agent-app | `/dashboard` | Department-scoped KPIs |
| Branch Manager | agent-app | `/dashboard` | Branch-scoped KPIs |
| Admin | agent-app | `/admin` → `/admin/users` | Users, roles, configuration, integrations |
| Customer | portal-app | `/tickets` (`/` redirects here) | Own tickets, KB, chat |

**KB Author/Editor** and **Auditor** are permission bundles inside the agent application, not
separate actor types. The architecture leaves the seam to promote either into a distinct experience
if requirements later demand it.

**Anonymous submitter** (unauthenticated web-form or chat submission) is **unconfirmed** — see section 13.

The landing route is resolved by the shell after authentication rather than hard-coded, so adding an
actor does not require changing the root route.

---

## 4. Workspace and module architecture

### 4.1 Structure

Applications contain only bootstrap, root providers, the layout shell, and top-level route
definitions. All feature code lives in libraries.

```
apps/
  agent-app          agent/admin application shell
  portal-app         customer portal shell
  agent-app-e2e      Playwright
  portal-app-e2e     Playwright

libs/
  shared/
    ui               design system, PrimeNG boundary, tokens, theme
    i18n             Transloco setup, DirectionService, locale formatting
    auth             pluggable session abstraction, guards, interceptor
    http             base client, interceptor chain, error normalization
    permissions      permission + scope engine, guards, directive, nav manifest
    realtime         socket connection manager, topic multiplexing
    observability    telemetry / error-reporting abstraction
    config           runtime configuration loader
    domain-models    cross-app domain types
    util             pure utilities
    testing          MSW harness, fixtures, test utilities

  {domain}/          one folder per business domain (tickets, customers, sla, kb, ...)
    feature-*        routed, smart, one screen or flow
    data-access      API client, DTO to model mappers, stores
    ui               presentational components for the domain
    model            types, enums, constants

  portal/
    feature-*        portal-specific features
```

### 4.2 Library types

| Type | Responsibility | Prohibited |
|---|---|---|
| `feature-*` | A routed screen or flow. Smart: injects stores and services | Importing another `feature-*` library |
| `data-access` | API client, DTO to domain mapping, stores for one domain | Components, templates |
| `ui` | Presentational components for one domain | HTTP, stores, injected services beyond translation |
| `model` | Types, enums, constants | Any runtime dependency |

**DTOs never leave their `data-access` library.** Features and UI components consume domain models
only. This is what makes a backend contract change a localized edit rather than a sweep.

### 4.3 Enforced boundaries

Enforced by `@nx/enforce-module-boundaries` as lint rules that fail the build.

| Tag | May import |
|---|---|
| `type:feature` | `type:data-access`, `type:ui`, `type:model`, `type:util` |
| `type:data-access` | `type:model`, `type:util`, `shared/http`, `shared/realtime` |
| `type:ui` | `type:model`, `type:util`, `shared/ui`, `shared/i18n` |
| `type:model` | nothing |
| `scope:agent` | `scope:agent`, `scope:shared` |
| `scope:portal` | `scope:portal`, `scope:shared` |
| `scope:shared` | `scope:shared` |

Two consequences are load-bearing:

1. A feature library importing another feature library is a **build failure**, not a review comment.
   This is the primary defense against the tangling that makes large CRMs unmaintainable.
2. `scope:agent` and `scope:portal` cannot import each other. This is the mechanical enforcement of
   agent/customer separation: a customer's bundle cannot contain agent code.

Additionally, **only `shared/ui` may import `primeng/*`** (section 9.4).

### 4.4 Rejected alternatives

- **Features as folders inside each app.** Folders cannot be tagged, so cross-feature imports creep
  in silently, and `nx affected` degrades to app granularity. Rejected: the agent application would
  grow into one very large project, which is the failure mode the scalability requirement targets.
- **Module-federation micro-frontends.** Version skew, shared-dependency complexity, harder theme
  and direction consistency, heavy operations burden. Rejected as unjustified at 50-200 agents,
  single tenant. Revisit only if independent per-subsystem deployment becomes an organizational
  requirement.

### 4.5 Standing conventions

- Standalone components only; no `NgModule`.
- `ChangeDetectionStrategy.OnPush` everywhere.
- `inject()` over constructor injection.
- Every feature library is lazy-loaded via `loadChildren`.
- Library creation goes through Nx generators so conventions cannot drift.

---

## 5. Routes and navigation

Every branch below is a lazy `loadChildren` boundary.

### 5.1 Agent application

| Route | Permission | Notes |
|---|---|---|
| `/auth/login`, `/auth/callback`, `/auth/logout` | — | |
| `/dashboard` | `dashboard.view` | Role-aware dashboard; managers may lack `ticket.view` |
| `/tickets` | `ticket.view` | Queue, saved views |
| `/tickets/new` | `ticket.create` | |
| `/tickets/:id` | `ticket.view` | Ticket console |
| `/customers`, `/customers/:id` | `customer.view` | |
| `/kb`, `/kb/:id` | `kb.view` | |
| `/kb/new`, `/kb/:id/edit` | `kb.author` | |
| `/notifications` | — | Own-data history |
| `/reports`, `/reports/:key` | `report.view` | |
| `/admin` | — | Redirects to `/admin/users` |
| `/admin/users` | `user.manage` | |
| `/admin/roles` | `role.manage` | |
| `/admin/departments` | `org.manage` | |
| `/admin/branches` | `org.manage` | |
| `/admin/sla` | `sla.manage` | |
| `/admin/escalation` | `sla.manage` | |
| `/admin/channels` | `channel.manage` | |
| `/admin/integrations` | `integration.manage` | |
| `/admin/audit-log` | `audit.view` | |
| `/settings/profile` | — | |
| `/403`, `/404`, `/offline` | — | |

Permission names shown are **provisional development fixtures**. The real catalogue is an open
question (section 13) and must be confirmed before permission-sensitive domain implementation.

### 5.2 Customer portal

| Route | Notes |
|---|---|
| `/` | Redirects to `/tickets` |
| `/auth/login`, `/auth/register`, `/auth/forgot-password` | Registration availability unconfirmed |
| `/tickets`, `/tickets/new`, `/tickets/:id` | |
| `/kb`, `/kb/:slug` | |
| `/chat` | |
| `/profile` | |

Portal authentication method and whether self-registration is permitted are open questions
(section 13).

### 5.3 Notification surface

Two surfaces, one data source: a bell and panel in the shell header for recent and unread items, and
`/notifications` for full history. Both read own-user data and therefore carry no permission
requirement.

### 5.4 Deliberately absent

`/inbox` is **not** defined. Whether agents work channels through a unified conversation inbox or
whether channel messages land inside ticket threads is an unresolved business decision
(section 13). No route, library, or model is introduced for it until that is decided.

---

## 6. Permission and scope model

### 6.1 Authority

**The backend is authoritative for all permission and data-scope enforcement.** Frontend checks
exist to produce a coherent user experience: hiding unreachable navigation, avoiding pointless
requests, and explaining denial. They are not a security boundary and must never be relied upon as
one. Any endpoint the frontend can call must independently enforce authorization server-side.

### 6.2 Model

A role is a bundle of named permissions. Each grant carries a **data scope** describing which
records it applies to. Provisional scope values: `own`, `team`, `department`, `branch`, `all`. The
concrete permission catalogue and the final scope vocabulary are open questions (section 13).

`PermissionsService` loads the permission-to-scope map from `GET /me` at bootstrap into a signal.

### 6.3 Enforcement surfaces

Three surfaces, one service:

1. **Route** — `canMatch` guards, deliberately not `canActivate`, so an unauthorized user never
   downloads the lazy chunk: `canMatch: [requirePermission('sla.manage')]`.
2. **Navigation** — the sidebar is built from a declarative manifest filtered through the same
   service, so a menu entry cannot appear without its route being reachable.
3. **Action UI** — the `*appHasPermission` structural directive on buttons, panels, and controls.

A feature applies whichever of these surfaces are applicable to it; not every feature has all three.

Denied navigation routes to `/403`. Silent redirects are prohibited: they make permission
misconfiguration invisible to both users and developers.

### 6.4 Multi-department and multi-branch

A user may belong to several departments and several branches. `ScopeContextService` holds the
**active** department and branch as a signal, surfaced as a switcher in the shell header and
persisted per user.

Scope is **not** injected into every outbound request globally. Requests opt in or out through an
explicit `HttpContext`-based scope policy (section 8.3), because a meaningful number of calls —
`GET /me`, runtime configuration, own notifications, global search — must not be scope-filtered.

The relationship between departments and branches (nested in either direction, or orthogonal
dimensions) is a **hard blocker** for Phase 0 (section 13).

---

## 7. Application state

### 7.1 Three tiers

| Tier | Mechanism | Rule |
|---|---|---|
| Component | `signal()` inside the component | Default. Anything not needed outside the component stays here |
| Feature | Signals in a feature-scoped service provided at the route | Filters, wizard progress, panel open state. Dies with the route |
| Shared server | NgRx SignalStore in a `data-access` library | Only under the three conditions below |

A SignalStore is warranted only when **all three** hold:

1. the entity is read by two or more features,
2. it is server-owned, and
3. it can be mutated from outside the current screen (socket event, another tab, background
   refresh).

A ticket qualifies: it appears in the queue, in the console, and a socket event can change it while
an agent is looking at it. A report filter does not qualify. This rule exists specifically to stop
SignalStore from spreading into places where a plain signal is correct.

### 7.2 Rationale

Angular Signals plus RxJS covers component and feature state without a library, which satisfies the
"prefer built-in capabilities" constraint. Cross-feature server state is the one area where the
built-ins leave real work — caching, invalidation, de-duplication, entity collections — so NgRx
SignalStore is adopted for that case only. It is signal-based rather than classic Redux, so it does
not introduce a second paradigm.

RxJS remains the tool for streams: socket subscriptions, debounced search, cancellation, and
retry orchestration.

---

## 8. Data access, API contract, and realtime

### 8.1 Data-access layer

One `data-access` library per domain, exposing:

- an **API client** — thin, typed, HTTP only, no business logic;
- **mappers** — DTO to domain model and back;
- **stores** — where section 7.1 warrants them.

### 8.2 Interceptor chain

Fixed order in `shared/http`:

1. **session** — attaches whatever credential the configured session strategy provides, and handles
   a single re-authentication attempt on `401`. Deliberately named `session`, not `bearer` or `jwt`:
   the transport mechanism is undecided and must remain pluggable (section 13).
2. **locale** — sets `Accept-Language` from the resolved user language.
3. **scope** — attaches the active department/branch **only when the request opts in** (section 8.3).
4. **request-id** — attaches a frontend-generated correlation identifier for client-side log
   stitching. This is distinct from the backend `traceId`; see section 8.4.
5. **error-normalizer** — converts any failure into the typed `AppError` of section 10.1.
6. **retry** — retries only **transient** failures (network error, timeout, `502`, `503`, `504`, and
   `429` honoring `Retry-After`), on idempotent requests, with capped exponential backoff and a
   bounded attempt count. Business errors and ordinary `4xx` responses are **never** retried.

### 8.3 Scope policy

Active-scope attachment is opt-in per request via an `HttpContext` token, not a global injection.
Each API client method declares whether it is scope-bound. Calls that must never be scope-filtered
(`GET /me`, runtime config, own notifications, global search) simply do not opt in.

### 8.4 Request identifiers

Two distinct identifiers, never conflated:

- **Frontend request id** — generated client-side, used to correlate client logs and telemetry for
  a single outbound call.
- **Backend `traceId`** — returned in the error envelope. **Authoritative for support and
  debugging.** This is the identifier surfaced to users on actionable failures and the one quoted in
  support escalations.

### 8.5 Required API contract

The backend does not exist yet, so the frontend publishes a **draft OpenAPI document** describing
what it requires. The draft may originate in the frontend repository, but the end state is **one
canonical API contract** consumed by frontend, backend, mocks, and tests alike. Its permanent home
and change-ownership process is a hard Phase 0 blocker (section 13).

Requirements of any backend:

- **Style.** REST/JSON, resource-oriented, plural nouns.
- **List envelope.** `{ items, page, pageSize, total }`. Query parameters: `page`, `pageSize`,
  `sort`, `q`, `filter[...]`, plus `departmentId` / `branchId` where the endpoint is scope-bound.
- **Error envelope.** `{ code, message, details?, traceId }`. The backend returns a **stable machine
  `code`; the frontend performs translation.** Server-rendered English strings cannot be shown to an
  Arabic user, so localized presentation cannot depend on the server's `message`, which is treated
  as a developer-facing diagnostic only. Unknown codes fall back to a generic translated message
  plus the `traceId`.
- **Timestamps.** ISO-8601 in UTC, always. This is an invariant of the API and of all internal
  representation. All locale-aware formatting is the frontend's responsibility. Display timezone
  policy is a separate, still-open question (section 13); the UTC invariant holds regardless of how
  it is resolved.
- **Optimistic concurrency.** Mutable records that two people can edit — tickets in particular —
  carry a `version` or ETag. A stale write returns `409`, and the console presents a conflict
  resolution prompt rather than silently overwriting a colleague's change.
- **Bootstrap.** `GET /me` returns identity, permissions with their scopes, department and branch
  memberships, and language preference in a single call.

### 8.6 Mocking

MSW (Mock Service Worker) handlers live in `shared/testing`, generated against the canonical
contract. One set of handlers serves three consumers: `nx serve` in mock mode, unit and component
tests, and Playwright E2E.

Because MSW intercepts at the network layer, real API clients and the full interceptor chain are
exercised. **No `if (mock)` branch appears anywhere in production code.** Handlers are validated
against the canonical contract so mocks cannot silently drift from it.

### 8.7 Realtime

`shared/realtime` owns one socket per application session, multiplexed by topic
(`chat:{conversationId}`, `tickets:{scope}`, `notifications:{userId}`).

- **Authorization is server-enforced.** Topic names are addressing, not capability. Knowing or
  guessing a topic name grants nothing; the server validates every subscription against the
  subscriber's permissions and scope.
- **Connection lifecycle** — exponential-backoff reconnect and automatic resubscription, exposed as
  a `connectionState` signal that drives an unobtrusive reconnecting indicator in the shell.
- **Events are dispatched into stores, never directly into components.** A screen behaves
  identically whether data arrived by fetch or by push.
- **On reconnect**, the service invalidates and refetches only the stores related to currently
  active subscriptions, rather than blanket-invalidating everything. Missed-event replay is
  deliberately not attempted: it is a distributed-systems problem the frontend should not own.

### 8.8 Optimistic updates

Default is **pessimistic**. A support ticket silently reverting is worse than a short spinner.

- Trivial, reversible, own-data actions (mark notification read, toggle a personal preference) may
  be optimistic.
- Assignment and status changes start pessimistic and become optimistic **only where the backend
  explicitly declares the operation safe for optimistic UI**.

---

## 9. Internationalization, direction, design system, responsiveness

Arabic/English and RTL/LTR are architectural requirements, addressed in the foundation rather than
retrofitted.

### 9.1 Translation

Transloco, with **lazy scopes aligned one-to-one with feature libraries** — `tickets.json`,
`admin.json`, `kb.json` load with their route chunk, so an agent never downloads admin strings.

- Key convention: `{scope}.{area}.{key}`.
- Missing keys throw in development, fall back to English in production, and are reported.
- Server error codes are translated from a dedicated `errors` scope (section 8.5).

**ICU / MessageFormat is enabled from day one and mandatory for any counted string.** Arabic has six
plural categories (`zero`, `one`, `two`, `few`, `many`, `other`); English `one`/`other` logic is
wrong in Arabic. Retrofitting this later means auditing every string in the product.

### 9.2 Locale-aware formatting

`LOCALE_ID` resolves once at injection time and therefore cannot follow a runtime language switch.
`shared/i18n` provides `Intl`-based formatting abstractions — `localeDate`, `localeNumber`,
`localeRelativeTime` and equivalents — that read the language signal and update reactively.

**Feature code must use the `shared/i18n` locale-aware formatting abstractions** for anything whose
presentation depends on locale. This is a targeted requirement about locale-dependent formatting,
not a blanket prohibition on Angular's pipes.

### 9.3 Language resolution and direction

**Resolution order** at bootstrap: authenticated server preference from `GET /me`, then
`localStorage`, then browser language, then `en`. Before authentication only the last three apply.

`localStorage` language is a **browser/device preference**, not an identity attribute. On logout and
on user switch the stored value must not be allowed to carry one authenticated user's server-side
preference into another user's session; the device preference is retained only as an
unauthenticated default, and the server preference always wins once a user is authenticated.

**`DirectionService` is the single source of truth for direction.** It derives direction from the
active language and synchronizes:

- the document's `lang` and `dir` attributes,
- Angular and CDK direction infrastructure (so overlays, menus, and dropdowns flip),
- PrimeNG and theme direction behavior through its supported configuration surface.

It must not depend on any PrimeNG internal implementation detail; direction integration goes through
supported APIs only.

Three enforcement mechanisms, because RTL defects are otherwise found by users rather than by
developers:

1. **Logical CSS properties are mandatory for application layout** — `margin-inline-start`,
   `inset-inline-end`, `text-align: start`, `border-start-start-radius`, and equivalents. A
   stylelint rule fails the build on physical `left`/`right` properties. Genuine exceptions
   (direction-independent visual effects, third-party overrides) require an **explicit, documented
   lint exception** rather than being impossible.
2. **`DirectionalIcon`** — arrows, chevrons, back/forward, and next/previous mirror automatically.
   Ad-hoc directional icons are where RTL consistently leaks.
3. **Direction-sensitive tests** (section 11).

**User-generated mixed-language content** — message bubbles, customer names, KB body content, free
text — uses `dir="auto"` by preference, so an English complaint inside an Arabic interface renders
LTR within its own bubble without dragging the surrounding layout. `detectDirection()` is used only
where component logic genuinely requires the computed direction value, not as a general substitute
for `dir="auto"`.

### 9.4 Design system

`shared/ui` is the **only** library permitted to import `primeng/*`, enforced by tag rule
(section 4.3). That boundary is what makes the abstraction real rather than aspirational.

Within that boundary, judgment applies: components are wrapped where wrapping adds architectural
value — a stable internal API, direction handling, permission integration, consistent empty/loading/
error states, token-driven styling. **One-off pass-through wrappers that add no value are avoided.**

Design tokens are CSS custom properties (color, spacing, radius, typography, elevation) defined in
one place; the PrimeNG theme is generated **from** those tokens, so theming and a future dark mode
do not touch component code.

Arabic and Latin scripts receive separate font stacks with different line-heights. Arabic requires
more leading at the same nominal size; using one stack for both is what makes bilingual interfaces
look subtly wrong.

### 9.5 Responsive policy

Responsive behavior is **route-specific**, not application-wide. Breakpoint tokens are shared across
both apps; CDK `BreakpointObserver` is wrapped as a `viewport` signal.

| Route class | Policy |
|---|---|
| Customer portal (all routes) | Mobile-first, scaling up |
| Operational workspace — ticket console, queues, admin | Desktop-first; tablet usable via collapsing side panels into drawers and tabs; **phone unsupported**, showing an explicit "open on a larger screen" notice rather than a broken layout |
| Management dashboard and KPI routes | **Responsive on phones**, with chart grids reflowing to a single column |

Management dashboards are explicitly mobile-capable; the phone limitation applies to operational
routes only.

---

## 10. Cross-cutting concerns

### 10.1 Error handling

The normalizer (section 8.2) produces one typed error shape:

```ts
interface AppError {
  code: string;        // stable machine code from the backend, or a client-side code
  httpStatus?: number;
  traceId?: string;    // backend-authoritative, present on server failures
  retriable: boolean;
  details?: unknown;   // structured, e.g. field-level validation
}
```

Presentation policy is fixed here so it is not re-decided per feature:

| Failure | Presentation | traceId shown |
|---|---|---|
| Field validation | Inline on the field, translated from `code` | No |
| Action failed | Toast, with retry when `retriable` | Yes |
| Page load failed | `ErrorState` with retry, route preserved | Yes |
| Session expired | Re-authentication flow, then return to the intended route | No |
| Forbidden | `/403` | No |
| Uncaught exception | Global `ErrorHandler`: report, plus a generic translated message | Yes |

`traceId` is surfaced in a copyable form for **actionable and system failures**, where support needs
it to investigate. It is not shown for routine field validation, where it is noise.

### 10.2 Runtime configuration

Loaded before bootstrap from a runtime endpoint or `config.json`: API base URL, socket URL, enabled
channels, enabled AI capabilities, feature flag defaults. Nothing environment-specific is compiled
into the bundle, so a single build artifact promotes from staging to production unchanged.

**Runtime configuration is public browser configuration.** It is fully visible to anyone who opens
the application. It must never contain secrets, credentials, private API keys, or server-only
configuration. Any value that must stay private stays server-side.

### 10.3 Feature flags

Signal-backed `FeatureFlagService`, with an `*appFeature` directive and a `requireFeature()`
`canMatch` guard composable with the permission guard.

Flags are required for:

- staged rollout of a capability,
- optional capabilities that some deployments or contexts disable,
- experiments,
- kill switches for risky or externally-dependent functionality.

Flags are **not** required for every subsystem by default. A stable, always-on capability does not
need one.

### 10.4 AI assistance layer

`ai/data-access` and `ai/ui`. The AI layer is architecturally peripheral: **no host feature ever
awaits an AI call to complete its own work.** Sending a reply, saving a ticket, and every other
core workflow must succeed with the AI layer entirely absent.

`AiAssistService` exposes one method per capability (summarize, suggest replies, categorize, suggest
solutions, chat), each surfacing a uniform state:

`idle` · `loading` · `ready` · `unavailable` · `error`

**`unavailable` is a first-class quiet state**, not an error. It covers capability disabled, service
unreachable, and insufficient permission identically, rendering a muted panel rather than an error
toast. Calls carry a short timeout and are cancellable.

Every AI-produced artifact is visually marked and requires an explicit **accept / edit / reject**
decision by a human, categorization included. Nothing is auto-applied. Accepting records provenance,
so downstream audit can show that a value was AI-suggested and who accepted it.

Configuration is **contextual**: capabilities are individually toggleable, and the design supports
evaluating that configuration in context rather than only globally. Whether AI behavior genuinely
varies **per department** is not confirmed and is recorded as an open question (section 13); the
architecture supports it without asserting it.

**Chatbot handoff** — the architecture must be able to carry a conversation from bot turns to a
human agent on the same transport, preserving the transcript so the agent sees what the bot already
said. The handoff **workflow itself is an unconfirmed business requirement** (section 13). No
specific state machine, trigger, or queueing behavior is declared here; only the capability to
support one without restructuring.

**Accept/reject telemetry** is recorded as a **proposed product metric**, not a confirmed
requirement. It is the most honest available measure of whether AI assistance helps, and is offered
for the product owner's decision. If adopted, it is subject to the telemetry allowlist (section
10.7).

### 10.5 Accessibility

WCAG 2.1 AA is adopted as an **architecture quality target**. It is not asserted as a contractual
obligation; whether it is contractually required is an open question (section 13). Treating it as a
target from the start is far cheaper than retrofitting.

The agent console is keyboard-first, since agents work in it for full shifts: a documented shortcut
map, focus management on dialogs and drawers, `aria-live` regions for toasts and incoming chat
messages, and focus indicators that survive theming. Automated axe assertions run in component
tests; keyboard traversal is covered in E2E.

### 10.6 Performance

The following are **initial targets**, not yet CI gates:

| Metric | Initial target |
|---|---|
| Agent app initial bundle | 400 KB gzipped |
| Portal initial bundle | 250 KB gzipped |
| Any lazy route chunk | 150 KB gzipped |
| LCP, queue and portal home | under 2.5 s at 4G-equivalent |

These are **baselined after Phase 0 and the first production-like feature**, and only then finalized
as enforced CI budgets. Setting hard gates before a real measurement exists produces either
meaningless numbers or constant false failures.

**List rendering policy:**

- **Server-side pagination is the default** for large business tables — ticket lists, customer
  lists, user administration, report tables.
- **Virtual scrolling** is for continuous or unbounded experiences where pagination is
  inappropriate: chat threads, activity timelines, and queues whose interaction model is continuous
  scanning rather than paging.

**Change detection.** The workspace uses the recommended change-detection configuration for the
Angular version it targets. Application code is signals-first and must not embed assumptions
specific to Zone.js, so the configuration can move with Angular's recommendations without a rewrite.

### 10.7 Observability

`shared/observability` exposes an abstraction for error reporting and lightweight telemetry, with a
no-op / development implementation as the default. A concrete vendor is **not** selected here:
whether third-party reporting is permissible at all may be constrained by data-residency policy, and
that is an open question (section 13). The abstraction lets Phase 0 proceed without the answer.

**Telemetry operates on an explicit allowlist.** Only fields named in the allowlist are ever
transmitted. Permitted examples: route identifier, resolved locale, direction, role, error `code`,
backend `traceId`, timing measurements.

**Never transmitted:** customer names, contact details, ticket or chat content, attachments, message
bodies, search query text containing user input, or arbitrary domain objects. A field is transmitted
only if it has been deliberately added to the allowlist; there is no catch-all serialization path.

---

## 11. Testing strategy

| Level | Tool | Coverage |
|---|---|---|
| Unit | Vitest | Services, stores, mappers, guards, pipes, utilities |
| Component | TestBed + Testing Library | Component behavior and rendering |
| Contract | MSW handlers validated against the canonical contract | Mocks cannot drift from the API contract |
| E2E | Playwright | Critical paths, in both locales and directions |

**Direction-sensitive testing.** Component tests run in both `ar`/RTL and `en`/LTR **where direction
or layout behavior actually matters** — layout-bearing components, directional icons, mixed-content
rendering, overlay positioning. Pure logic tests are not blindly duplicated across locales; that
doubles cost without adding signal.

**E2E critical paths:** login, create ticket, reply to ticket, assign, escalate, SLA breach warning,
portal ticket submission and tracking, KB search, and permission denial routing to `/403`.

**CI gate:** `nx affected` lint, test, and build; the stylelint logical-property rule; axe checks.
Bundle budgets join the gate after baselining (section 10.6).

### 11.1 Definition of done, per feature

- Tests written at the appropriate levels.
- Verified in both locales and both directions where direction or layout matters.
- **Permissions enforced at every applicable frontend surface** — route guard, navigation manifest,
  and action UI, as applicable to that feature. Backend authorization remains authoritative
  (section 6.1).
- Empty, loading, and error states present.
- Keyboard traversable.
- Arabic and English translation keys complete.

---

## 12. Build phases

Libraries are created when the subsystem that needs them is built, not upfront.

| Phase | Libraries created |
|---|---|
| 0 · Foundation | all `shared/*`, both application shells |
| 1 · Agent core | `tickets/*`, `customers/*` |
| 2 · Omnichannel | `channels/*`, `notifications/*` |
| 3 · Service levels | `sla/*`, `kb/*` |
| 4 · Portal | `portal/*` |
| 5 · Governance and insight | `admin/*`, `reports/*` |
| 6 · Assist and integrate | `ai/*`, `integrations/*` |

### 12.1 Phase 0 boundary

Phase 0 delivers:

- Nx workspace, both application shells, tag rules, and library generators.
- `shared/http` with the full interceptor chain and scope policy.
- `shared/auth` — pluggable session abstraction with a development implementation.
- `shared/permissions` — engine, `canMatch` guard, directive, navigation manifest, driven by
  provisional development fixtures.
- `shared/i18n` — Transloco with ICU, lazy scope wiring, locale formatting abstractions,
  `DirectionService`.
- `shared/realtime` — connection manager, topic multiplexing, reconnect and resubscription.
- `shared/observability` — abstraction with a no-op / development implementation.
- `shared/config` — runtime configuration loader.
- `shared/ui` — **foundational primitives only**: application shell and layout, buttons, form field
  and translated validation rendering, dialog and drawer services, toast, confirm, empty / error /
  loading states, `PermissionGate`, `DirectionalIcon`, design tokens, and theme.
- `shared/testing` — MSW harness and fixtures.
- Error handling, the draft canonical OpenAPI document, and the CI pipeline.
- Both applications booting to an authenticated, translated, direction-correct empty shell in both
  Arabic and English.

**Explicitly not in Phase 0:** `DataTable`, `SlaClock`, `RichTextEditor`, `Timeline`,
`DateRangePicker`, and comparable domain-driven components. Each is created when its first consuming
domain requires it, so its API is shaped by a real use case rather than speculation.

---

## 13. Open questions register

Every entry below is a gap found during design and deliberately **not** filled in with an invented
business rule. Each has an owner decision to make.

### 13.1 Hard blockers — must be decided before or during Phase 0

| # | Question | Why it blocks |
|---|---|---|
| B1 | **Department and branch relationship.** Is a branch nested inside a department, a department inside a branch, or are they orthogonal dimensions? Can a user belong to several of each? | The shell's scope switcher, `ScopeContextService`, and the shape of every scoped query depend on this |
| B2 | **Brand and design tokens.** Do brand colors, typography, and an existing visual identity exist? If not, explicit approval to proceed with temporary placeholder tokens is required | `shared/ui` generates the PrimeNG theme from tokens; changing the token model later is rework across every component |
| B3 | **Browser support matrix.** | Determines availability of container queries, `:has()`, and logical-property fallbacks, which the layout and RTL strategy rely on |
| B4 | **Canonical API contract ownership.** Where the contract lives permanently, who merges changes, and how frontend and backend both consume it | Section 8.5 requires one canonical contract; without an owner it forks immediately |

### 13.2 May remain open during Phase 0 — interim strategy defined

| # | Question | Interim strategy | Must be resolved by |
|---|---|---|---|
| P1 | **Final permission catalogue** — real permission names and the concrete scope vocabulary | Build the permission and scope abstraction against **provisional development fixtures** | Before any permission-sensitive domain implementation |
| P2 | **Telemetry vendor and data-residency policy** — whether third-party reporting is permissible | Build the `shared/observability` abstraction with a **no-op / development implementation** | Before production observability is required |
| P3 | **Display timezone policy** — with multiple branches, does an agent see times in their own timezone, the branch's, or the customer's? | Establish **UTC ISO-8601 as the API and internal invariant** now; display policy is a presentation-layer decision layered on top | Before SLA and reporting implementation, where it materially changes meaning |

### 13.3 Blocking specific subsystems

To be resolved before that subsystem's own specification is written.

| Subsystem | Open questions |
|---|---|
| **Omnichannel** | **Unified inbox versus channel-messages-inside-tickets** — the largest single unknown; no `/inbox` surface exists until it is decided. Whether an **anonymous submitter** (unauthenticated web form or chat) exists, and how an anonymous submission later links to a customer record |
| **Tickets** | Ticket lifecycle: statuses, permitted transitions, and who may perform each. Taxonomy: categories, priorities, types. Whether per-department custom fields exist. Whether a ticket can move between departments or branches |
| **Customers** | Is a customer a person, or an organization with multiple contacts? Are merge and deduplication required? |
| **SLA** | Which clocks exist (first response, resolution, others). Working-hours and business-calendar rules. Pause conditions. Whether targets vary by priority, department, or customer tier |
| **Escalation** | Trigger conditions, escalation levels, who receives at each level, and whether escalation is automatic or approval-based |
| **Notifications and reminders** | In-app only, or also email, push, and SMS? Granularity of per-user preferences. What a reminder attaches to and whether it can be snoozed |
| **Knowledge base** | Authoring workflow (draft, review, publish?). Versioning. **Content i18n model: is an Arabic article a linked translation of its English counterpart, or an independent article?** This is a data-model question distinct from interface translation and it shapes the entire subsystem |
| **Customer portal** | Is self-registration permitted? What authentication method do customers use? |
| **Reports** | Which reports exist. Export formats. Whether scheduled or emailed reports are required |
| **Admin and governance** | What the audit log records, its retention period, and who may read it |
| **Integrations** | What the console actually does — outbound webhooks, API key management, third-party connectors, or a combination |

### 13.4 Cross-cutting items recorded as unconfirmed

| # | Item | Status |
|---|---|---|
| U1 | **Authentication mechanism** — the session transport (OIDC redirect, JWT, session cookie, or other) and whether staff and customers use different mechanisms | Undecided. `shared/auth` is pluggable specifically so this can be answered later |
| U2 | **Anonymous submitter as an actor** | Unconfirmed. Not modeled anywhere until confirmed |
| U3 | **Per-department AI configuration** | Unconfirmed. Architecture supports contextual capability flags without asserting department-level behavior |
| U4 | **Bot-to-human handoff workflow** | Unconfirmed business requirement. Architecture can support it; no workflow is declared |
| U5 | **AI accept/reject telemetry** | Proposed product metric, awaiting product-owner decision |
| U6 | **WCAG 2.1 AA as a contractual requirement** | Adopted as an architecture quality target; contractual status unconfirmed |
| U7 | **Attachments policy** (cross-cutting) | Size limits, permitted types, virus scanning, and whether upload goes direct-to-storage via presigned URL or through the API |
| U8 | **Hijri calendar and Arabic-Indic numerals** | Currently not required. Recorded because both are materially cheaper to plan for than to retrofit |

---

## 14. Approval record

The design was developed through structured requirements discovery and reviewed in six sections.
Each section was approved with amendments, all of which are incorporated above:

| Section | Outcome |
|---|---|
| 1 · Workspace and module architecture | Approved as presented |
| 2 · Actors, routes, permission enforcement | Approved with 5 amendments (backend-authoritative permissions; `/admin` redirect; customer landing route; notification surface; `/inbox` deferred) |
| 3 · State, data access, API contract, realtime | Approved with 8 amendments (pluggable session interceptor; transient-only retry; opt-in scope policy; request-id versus traceId separation; canonical contract requirement; server-enforced subscription authorization; targeted reconnect invalidation; pessimistic-by-default mutations) |
| 4 · i18n, direction, design system, responsiveness | Approved with 9 amendments (scoped formatting requirement; device-versus-server language preference; DirectionService independence from vendor internals; documented lint exceptions; `dir="auto"` preference; deferred component creation; proportionate wrapping; route-specific responsive policy) |
| 5 · AI, errors, configuration, quality attributes | Approved with 13 amendments (AI configuration and handoff unconfirmed; telemetry as proposal; traceId scoping; runtime config contains no secrets; proportionate feature flagging; WCAG as target; performance targets baselined before gating; pagination default; version-appropriate change detection; telemetry allowlist; proportionate direction testing; per-surface permission enforcement) |
| 6 · Open questions and Phase 0 boundary | Approved with reclassification of Phase 0 blockers into hard blockers and items that may remain open with a defined interim strategy; actor list confirmed |

**Next step:** implementation plan for Phase 0, to be written only after this document is reviewed
and approved.
