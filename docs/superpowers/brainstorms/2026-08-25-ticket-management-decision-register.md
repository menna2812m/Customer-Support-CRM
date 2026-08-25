# Ticket Management — Decision Register

Working artifact for the Phase 1 brainstorm. **Not the specification.** The spec is written only
after the brainstorm completes, and it will separate resolved decisions from client-blocked ones
exactly as they are separated here.

Governing contract: `docs/superpowers/specs/2026-08-24-customer-support-crm-frontend-architecture-design.md`.

Rules this register enforces:

- Business rules are **never invented**. An unanswered business rule becomes a numbered open
  question with the exact wording to put to the client, and the brainstorm continues past it.
- Technical decisions are made **only where the approved architecture already determines them**, and
  each records its trade-off.
- No production code, and no edit to `docs/api/openapi.yaml`, until the behaviour it would describe
  is resolved.

Status legend: **OPEN** — awaiting client · **RESOLVED** — decided from the architecture ·
**PROVISIONAL** — decided, but a later decision in this brainstorm may revise it.

---

## 1. Inherited blockers

| ID | Question | Source | Blocks |
|---|---|---|---|
| **B1** | Department/branch relationship: orthogonal dimensions, branch contains departments, or department contains branches | Spec §13.1 | Ownership, department/branch scope, transfer, data scopes, queue scope filter, assignment eligibility, API scope parameters, `ScopeContextService`, scope switcher |
| **P1** | Final permission catalogue and scope vocabulary | Spec §13.2 | Every permission-gated surface. The ticket-specific slice is being accumulated in section 4 below and will be handed back for confirmation as a concrete list |
| **P3** | Display timezone policy | Spec §13.2 | Timestamp rendering in the timeline and queue. UTC remains the storage and transport invariant regardless |
| **U7** | Attachments policy — size limits, permitted types, virus scanning, direct-to-storage vs through-API | Spec §13.4 | Decision 3 |
| **OMNI** | Unified inbox vs channel messages inside ticket threads | Spec §13.3 | Shapes the conversation model. Mitigated by TD-1 |

The client questions for B1 were delivered on 2026-08-25 and are reproduced in section 6.

---

## 2. Open business questions

### Ticket lifecycle (decision 0 — asked, awaiting client)

Nothing about statuses, transitions, SLA pause behaviour, closure, or reopening is assumed anywhere
in this register or in the eventual spec until these return.

| ID | Question to put to the client |
|---|---|
| TQ-1 | "Walk me through one ordinary ticket from the moment it arrives to the moment nobody looks at it again. Name each state out loud, in your words." Capture both Arabic and English wording — these become translation keys and the client's own vocabulary is what agents will expect on screen |
| TQ-2 | "Is there a step between 'it arrived' and 'someone is working on it'? Does a ticket sit in a pool waiting to be picked up, or is it always someone's from the start?" |
| TQ-3 | "When you're waiting on the customer to reply, does the response clock stop? What happens if they never reply — does it close itself after some period, or sit there forever?" |
| TQ-4 | "Is 'resolved' the same as 'closed', or is there a window where the customer can come back and say it isn't fixed?" If different: what closes it — the customer, a timer, or an agent? |
| TQ-5 | "Can a closed ticket be reopened? By whom — the agent, a supervisor, the customer? Forever, or only within a window? Or does it become a new ticket linked to the old one?" |
| TQ-6 | "Is there a way for a ticket to end that isn't a resolution — spam, duplicate, raised by mistake? Should those show up in 'tickets resolved this month'?" |
| TQ-7 | "Does a ticket ever wait on someone who is neither you nor the customer — a vendor, another internal team? Is that different from waiting on the customer?" |
| TQ-8 | "Who declares a ticket resolved — the agent who worked it, a supervisor who checks it, or the customer confirming?" |

**The test offered to the client for whether a candidate status is real:** it must (1) be something
someone filters a queue by, (2) change who is responsible, or (3) start or stop a clock. A candidate
failing all three is a flag on the ticket, not a status. Statuses are a guarded state machine with
audit entries; flags are independent booleans. Modelling a flag as a status forces artificial
transitions nobody can answer.

TQ-3 and TQ-6 are the two most often skipped and most often the cause of rework: the first decides
the clock model, the second decides whether the resolution rate is a real number.

### Decision 1 — comments / conversation model

| ID | Question to put to the client | Why it changes the model |
|---|---|---|
| TQ-9 | "Once an agent has posted a message on a ticket, can they edit it? Delete it? Within a time window, or forever? Who else can — a supervisor?" | Decides whether the timeline is strictly append-only in the UI as well as the data model, and whether edit/delete permissions exist at all |
| TQ-10 | "If a message the customer already saw is edited, what should the customer see — the new text, the old text, or that it was edited?" | Only asked if TQ-9 permits editing. Determines whether an edit is a new entry superseding the old one or a mutation |
| TQ-11 | "Do agents need to write plain text, or do they need formatting — bold, lists, links, inline images?" | Rich text triggers building `RichTextEditor`, which spec §12.1 explicitly defers until first needed, and introduces an HTML-sanitisation security surface. A material scope change either way |
| TQ-12 | "When a call comes in by phone, or a customer walks in, does the agent log that conversation on the ticket? Is it recorded as the customer speaking, or as the agent noting what the customer said?" | Decides whether author and poster are the same person. If an agent can post *as* the customer, every entry needs both an author and an actor, and the audit story changes |
| TQ-13 | "Do agents need to pull a colleague into a ticket by name — an @mention — and should that notify them?" | Adds a mention model and a Phase 2 notification dependency. Cheap to add now, expensive to retrofit into stored content |
| TQ-14 | "Should the customer see the individual agent's name and photo, or just 'Support'?" | Privacy and staffing policy. Changes the author payload the portal is allowed to receive |
| TQ-15 | "Is the first reply the customer can see the moment your 'first response' promise is met, or is it something else?" | SLA is Phase 3, but this decides whether first-response is derivable from the timeline or needs its own recorded timestamp. Cannot be reconstructed later for tickets already closed |
| TQ-16 | "Is there any message an agent should be able to write that other agents cannot see — visible only to supervisors, for example?" | A third visibility tier beyond internal/customer-visible. Changes visibility from a boolean to an enumeration, and the query has to filter on it server-side |
| TQ-17 | "Is there a maximum length for a message?" | Validation rule and a contract constraint |
| TQ-18 | "Oldest message at the top, or newest?" | Product preference. Recommendation offered in TD-9; confirm rather than assume, because it is the kind of thing agents have strong habits about |

**Already open in the architecture, restated because this decision collides with it:** OMNI —
"When email and WhatsApp arrive in Phase 2, do those messages appear in this same ticket thread, or
in a separate inbox?" (spec §13.3). TD-1 is chosen so that either answer stays cheap.

---

## 3. Technical decisions

### Decision 1 — comments / conversation model

| ID | Decision | Status | Trade-off |
|---|---|---|---|
| **TD-1** | The ticket conversation is a single **append-only timeline of typed entries** carrying a `kind` discriminator, not an array of `Comment` objects | **PROVISIONAL** — decision 8 (history/activity) may confirm or collapse it | Two independent forces point the same way: OMNI is unresolved, so a Phase 2 channel message should become a new `kind` rather than a schema migration plus a console rewrite; and decision 8 will ask whether status changes and messages share one timeline, which needs the same union. Cost is a discriminated union instead of a flat list — real but small. **This does not decide OMNI**; it keeps both answers cheap |
| **TD-2** | Entries are a **paginated sub-resource**, `GET /tickets/{id}/entries`, using the §8.5 list envelope — not embedded in the ticket payload | RESOLVED | A long-running ticket's thread is unbounded. Embedding makes every ticket fetch grow without limit and forces the whole thread to re-serialize on every ticket cache write. Cost: two requests to render the console, issued in parallel |
| **TD-3** | Posting an entry **must not bump the ticket's `version`/ETag** | RESOLVED | §8.5 gives tickets optimistic concurrency. If a message bumped the version, every colleague with an open edit form would take a spurious `409` for a change that touched none of their fields — and a conflict prompt that cries wolf gets dismissed reflexively, which is worse than not having one. Cost: the client cannot infer "the thread moved" from the ticket version and needs its own signal (decision 12) |
| **TD-4** | If editing or deletion is permitted at all (TQ-9), it is modelled **non-destructively** — a superseding entry, never an in-place mutation or a hard delete | RESOLVED *(shape)* — gated by TQ-9 *(whether)* | A support conversation that can be silently rewritten is not evidence, and the ticket history requirement in the brief presumes it is. Cost: the timeline must render superseded entries as such rather than making them vanish |
| **TD-5** | Sending is **pessimistic** (§8.8). The composer's text is preserved in **memory only** — feature-tier signal, surviving navigation within the session — and is **not** written to `localStorage` | RESOLVED | Pessimistic means the user waits; the failure that actually hurts is losing 300 words. But drafts contain customer PII, and `shared/auth` deliberately keeps identity in memory only "so a shared support terminal cannot leak one agent's identity to the next". A draft in `localStorage` survives logout and violates the same principle. Cost: a browser reload loses the draft. On a shared support terminal that is the correct trade |
| **TD-6** | Entry content is user data: **never translated**, rendered with `dir="auto"` per entry (§9.3), independent of the interface language. Surrounding metadata — author label, relative timestamp, visibility badge — **is** translated and follows the interface direction | RESOLVED | Required by §9.3, which names message bubbles explicitly. No trade-off; the alternative is broken bidirectional rendering |
| **TD-7** | Timestamps arrive UTC ISO-8601 and render through the existing `LocaleDatePipe` / `LocaleRelativeTimePipe` in `shared/i18n` | RESOLVED, with a dependency on P3 | Until P3 resolves, `Intl` renders in the viewer's own timezone. If the client later mandates branch or customer timezone, it is a formatting-layer change, not a data change |
| **TD-8** | The entry list is **feature-tier state in the console**, not an NgRx SignalStore | RESOLVED | §7.1 requires all three of: read by 2+ features, server-owned, mutable from outside. The entry list is server-owned and externally mutable but is read by exactly one feature today, so it fails the test. Promotion trigger recorded: the first second reader — most likely Phase 2 notifications or a channel surface. The spec adds this rule specifically to stop SignalStore spreading where a plain signal is correct |
| **TD-9** | Oldest entry first, newest at the bottom, composer beneath — chat ordering | **PROVISIONAL** — confirm via TQ-18 | Matches the reading order of a conversation and means the newest content sits next to the reply box. Email-style newest-first suits skimming long threads but puts the composer far from the message being answered. Weak preference; the client's habit should win |

---

## 4. Emerging ticket permission catalogue

Accumulated as decisions are made, to be confirmed as a block against P1 rather than asking the
client to invent permission names in the abstract. Names are provisional.

| Permission | Introduced by | Notes |
|---|---|---|
| `ticket.view` | Spec §5.1 | Already in the route table |
| `ticket.create` | Spec §5.1 | Already in the route table |
| `ticket.comment.create` | Decision 1 | Distinct from `ticket.view`: a read-only viewer (auditor, manager) can see a ticket without being able to write on it |
| `ticket.comment.edit` | Decision 1 | Exists only if TQ-9 permits editing. May need to distinguish own vs others' entries |
| `ticket.comment.delete` | Decision 1 | Exists only if TQ-9 permits deletion |

---

## 5. Pending OpenAPI contract changes

Recorded, **not yet written**. `docs/api/openapi.yaml` is not edited while the behaviour it would
describe is unresolved. B4 fixed the contract as jointly owned and changed by pull request.

### From decision 1

| Change | Blocked by |
|---|---|
| `GET /tickets/{id}/entries` — paginated, standard list envelope | Nothing structural. Entry schema fields blocked below |
| `POST /tickets/{id}/entries` | Entry schema |
| `TicketEntry` schema with a `kind` discriminator | The set of kinds is blocked by OMNI and decision 2 (internal vs customer-visible) |
| Explicit contract statement that posting an entry does not change the ticket's `version` | Nothing — can be written as soon as the entries endpoints are |
| `author` vs `actor` on an entry | TQ-12 |
| `visibility` field: boolean or enumeration | TQ-16 and decision 2 |
| Content type: plain text vs sanitised HTML, and max length | TQ-11, TQ-17 |
| Edit/supersede endpoint | TQ-9, TQ-10 |
| First-response timestamp: derived or recorded | TQ-15 |

---

## 6. B1 — client questions already delivered

Reproduced so the register is self-contained.

1. "Is there a person accountable for a whole location across every function — a Riyadh manager
   answerable for Support, Billing, and Technical tickets in Riyadh? If we gave them no such view,
   would that be wrong?"
2. "Is there a person accountable for a whole function across every location — a Head of Support
   answerable for Support tickets in all three cities?"
   *Both yes → orthogonal. Only 2 → department contains branches. Only 1 → branch contains departments.*
3. "Is Support in Riyadh the same team as Support in Jeddah — same manager, same standards, people
   cover for each other — or two separate teams that happen to share a name?"
4. "When a ticket arrives, what decides its branch: where the customer is registered, which office
   physically handles it, or where the product was bought? Can that answer change while the ticket
   is open?"
5. "Can one agent work tickets for more than one city? For more than one function? Is there anyone
   who does both?"
6. "Do you need 'all tickets in Jeddah, all functions' as a number someone is held to in a review?"
7. "Does a customer belong to a branch? If a Jeddah customer calls the Riyadh office, whose ticket
   is it?"

---

## 7. Brainstorm progress

| # | Decision | State |
|---|---|---|
| 0 | Ticket lifecycle, statuses, transitions | **BLOCKED** — TQ-1…TQ-8 |
| 1 | Comments / conversation model | **Analysed** — TD-1…TD-9 recorded, TQ-9…TQ-18 open |
| 2 | Internal notes vs customer-visible replies | Next |
| 3 | Attachments | Pending |
| 4 | Customer association | Pending |
| 5 | Ticket creation sources / channels | Pending |
| 6 | Priority model | Pending |
| 7 | Category / type model | Pending |
| 8 | Ticket history / activity timeline | Pending — will confirm or collapse TD-1 |
| 9 | Queue / list UX independent of organizational scope | Pending |
| 10 | Search / filter / sort independent of B1 | Pending |
| 11 | Optimistic concurrency UX | Pending |
| 12 | Realtime requirements specifiable independently of scope | Pending |
| 13 | Loading / error / empty states | Pending |
| 14 | Arabic / English and RTL behaviour | Pending |
| 15 | Accessibility | Pending |
| 16 | Testing and acceptance criteria | Pending |
