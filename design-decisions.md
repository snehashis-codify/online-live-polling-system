# Design Decisions Log

Interview-prep notes: for each decision, the options considered, what was picked, and why. Update this as new design calls come up.

---

## Storing responses and answers (Phase 0 — response/answer schema)

### Decision: separate `responses` and `answers` tables (header / line-item pattern)

One `responses` row per submission event; one `answers` row per selected option within that submission. Same shape as `orders` → `order_items`.

**Why not a single flattened table** (poll/user/question/option/submittedAt all on one row)?

1. **Duplicated submission metadata.** `respondentId` and `submittedAt` would repeat across every answer row from the same submission, with no guarantee they stay consistent (e.g. a bug giving two rows from the "same" submission different timestamps).
2. **Nowhere to attach the one-response-per-user rule.** "One editable response per authenticated user per poll" is a constraint on the *submission event*, not on an individual answer. A `UNIQUE(pollId, respondentId)` constraint needs a single row per submission to live on.
3. **Fragile edits.** Resubmission = delete the `responses` row (cascades to delete its `answers` via FK) and reinsert. Without a `responses` row, you'd delete by matching a composite of `(pollId, respondentId, submittedAt)`, which breaks if two submissions land at the same timestamp.
4. **Room for submission-level metadata** (time taken, device info, etc.) without smearing it across every answer row.

**Concrete example.** Poll "Favorite Color" has 2 questions: Q1 (radio: pick one), Q2 (checkbox: pick multiple). User5 submits: Q1 → "Blue", Q2 → "Pizza" and "Pasta".

With separate tables:

```
responses table:
| id   | pollId | respondentId | submittedAt |
| r1   | poll1  | user5        | 10:00       |

answers table:
| id | responseId | optionId       |
| a1 | r1         | "Blue" option  |
| a2 | r1         | "Pizza" option |
| a3 | r1         | "Pasta" option |
```

One `responses` row identifies "user5 submitted to poll1 at 10:00." Three `answers` rows hang off it via `responseId`.

If flattened into a single table instead (`pollId`, `respondentId`, `submittedAt` copied onto every answer row):

```
answers table:
| id | pollId | respondentId | submittedAt | optionId       |
| a1 | poll1  | user5        | 10:00       | "Blue" option  |
| a2 | poll1  | user5        | 10:00       | "Pizza" option |
| a3 | poll1  | user5        | 10:00       | "Pasta" option |
```

Looks harmless with 3 rows, but breaks down in practice:

- **No row to enforce "one response per user" on.** The rule now means "these 3 rows happen to share the same `pollId`+`respondentId`+`submittedAt`" — a unique constraint can't express that across a group of rows, only application code checking after the fact.
- **Editing means matching on data, not an ID.** Resubmission requires `DELETE FROM answers WHERE pollId=poll1 AND respondentId=user5`, not a delete by primary key. If `submittedAt` ever drifts by even 1ms across the 3 rows (e.g. written one at a time), the delete can miss rows or grab the wrong ones.
- **Counting responses means deduplicating.** "How many people responded?" becomes `COUNT(DISTINCT pollId, respondentId, submittedAt)` instead of a plain `COUNT(*) FROM responses WHERE pollId = poll1`.

The `responses` table exists to give "one submission event" its own identity — something to attach a unique constraint to, delete-and-replace on edit, and count directly. `answers` just says what was picked, tied back to that event via `responseId`.

---

### Decision: multi-select (checkbox) answers = one row per selected option, not an array column

Considered: `answers.selectedOptionIds` as a `uuid[]`/`jsonb` column (one row per question) vs. one `answers` row per `(response, option)` pair (radio = 1 row, checkbox = N rows).

**Why not the array column?**

- **No FK integrity.** Postgres can't enforce a foreign key against elements of an array/jsonb column. If an option is later deleted, stale IDs can silently remain in the array — the app has to clean it up manually.
- **Analytics gets harder.** "How many people picked option X" needs `unnest()` before you can `GROUP BY`, instead of a plain `GROUP BY optionId` on a normalized table.
- **Every option-detail lookup needs unnest+join**, not just analytics — response detail views, exports, etc. all pay the cost.

**Chosen:** one `answers` row per selected option, with a real `optionId` FK. Radio questions naturally produce exactly 1 row; checkbox questions produce N rows (one per checked box).

---

### Decision: authenticated respondents get exactly one editable response per poll

Considered three options:
1. Unlimited independent submissions (every submit = new row, all counted in totals)
2. One immutable submission (reject any second attempt)
3. **One editable submission (resubmit replaces the previous answer)** ← chosen

**Why not unlimited submissions counted independently?** A poll is meant to capture each participant's current opinion, not reward repeat clicking — letting one user's 3 submissions count as 3 votes lets anyone skew results.

**Why editable rather than immutable?** Matches the standard pattern in real polling tools (Google Forms "edit response," Slido, Doodle) — users can change their mind while the poll is still open.

**Enforcement:** partial unique index on `responses(pollId, respondentId) WHERE respondentId IS NOT NULL`. On resubmission: look up the existing response by `(pollId, respondentId)`, delete-and-reinsert its `answers`, update `submittedAt`.

**Anonymous mode:** no `respondentId` to dedupe against, so every anonymous submission is independent by necessity — not something being solved for, just an accepted limitation of anonymous polls (same as most real tools).

---

### Decision: `answers` stores only `optionId`, not a redundant `questionId`

Considered storing both `questionId` and `optionId` directly on `answers` (denormalized, since `optionId` alone can be joined back through `options.questionId`) vs. storing only `optionId`.

**Chosen:** `optionId` only — strict normalization, no derived data stored redundantly. The Phase 4 analytics query does `answers JOIN options ON options.id = answers.optionId` to get `questionId`, which is cheap given `answers.optionId` is indexed (consistent with the existing `*_idx` pattern on other FKs in the schema).

**Tradeoff acknowledged:** the denormalized version (`questionId` + `optionId` both on `answers`) would make the analytics query a single-table `GROUP BY` instead of a join — chosen against it in favor of not storing derived/redundant data.

---

### Decision: no anonymous-submission limiting (out of scope)

Considered adding a mechanism to cap how many times an anonymous respondent can submit to the same poll — options ranged from client-side only (localStorage flag, zero backend change, purely UX) to a server-tracked anonymous token (cookie + nullable `anonymousToken` column on `responses` with a partial unique index, same pattern as `respondentId`) to IP-based limiting.

**Why left out:** none of these actually stop a *determined* anonymous user — incognito mode, clearing cookies, or a different device defeats any client-side or cookie-based check trivially, and IP-based limiting breaks for shared/NAT'd IPs and is bypassed by a VPN. Anything short of requiring authentication only adds friction, not real enforcement. Since `responseMode` already offers authenticated mode (which *does* get real one-per-user enforcement via the `respondentId` unique index) as the option for polls where duplicate prevention matters, anonymous mode is left genuinely unlimited by design — a poll creator who cares about this can require authenticated responses instead.

**How to revisit:** if this becomes a real requirement later, the server-tracked anonymous token approach (option 3 above) is the middle ground — add before building out anonymous-mode submission if it turns out to matter.

---

## Final schema shape (responses/answers)

- **`responses`**: `id`, `pollId` (FK → polls, cascade), `respondentId` (nullable FK → users, cascade), `submittedAt`. Partial unique index on `(pollId, respondentId) WHERE respondentId IS NOT NULL`.
- **`answers`**: `id`, `responseId` (FK → responses, cascade), `optionId` (FK → options, cascade), `createdAt`. Indexed on `responseId` and `optionId`.

---

## Poll lifecycle — creator side (Phase 2)

No schema changes needed — `pollTable.status` (draft/active/closed) and `pollTable.expTime` (nullable timestamp) were already added in Phase 0.

### Decision: draft→active transition is a dedicated action endpoint, not a generic PATCH

Considered:
1. Fold `status`/`expTime` into a generic `PATCH /poll/:id/update` alongside any other editable field.
2. **`POST /poll/:id/activate`** — a dedicated endpoint that only performs the draft→active transition. ← chosen

**Why not the generic PATCH?** A single "update" endpoint invites ambiguity about what's actually legal — can you set `status` directly to `closed`? Edit questions after the poll is already active and has responses? A generic patch has no natural place to enforce "this is a state machine, not a bag of mutable fields."

**Chosen:** a named action endpoint that only allows `draft → active`, requires `expTime` in the request, validates it's in the future, and rejects the call outright if the poll isn't currently `draft` (no re-activation, no activating an already-closed poll).

---

### Decision: expiry enforcement is lazy/computed, not an eager DB status flip

Considered:
1. **Lazy/computed** — `status` stays `active` in the DB past `expTime`; anywhere that needs to know if a poll is accepting responses computes `status === 'active' && (expTime === null || expTime > now())`. ← chosen for now
2. Eager flip via a scheduled job (e.g. Inngest `step.sleepUntil(expTime)` at activation time) that writes `status = 'closed'` the moment a poll expires.

**Why not eager/Inngest, at least for now?** Even with a background job reliably flipping `status`, the Phase 3 submission endpoint still has to independently check `expTime > now()` at write time — there's an unavoidable race window between actual expiry and the job executing, so a background job can never be the *sole* gate on a correctness-critical accept/reject decision. That makes eager-flip additive (nicer-looking `status` in list/dashboard views) rather than required, and it comes with real setup cost (SDK, dev server, a callback endpoint, signing keys in prod).

**Revisit in Phase 6:** once Socket.io is in place, "poll just expired" becomes something worth actively *pushing* to a live creator dashboard the instant it happens, not just computing lazily on next request — that's where Inngest's delayed-execution model (schedule the "close" event at activation time) earns its keep. Introducing it in Phase 2 would mean maintaining two status-derivation code paths (lazy check + eager job) before the second one is actually needed.

**Implication:** a shared `isPollOpen(poll)` helper (checking `status` + `expTime` against `now()`) is used both by the Phase 2 list/detail responses (to report a derived `isOpen`/effective status to the frontend) and by the Phase 3 submission check — one place owns the definition of "open."

---

### Decision: poll detail authorization returns 404, not 403, for non-owned polls

Fetching another creator's poll by ID returns 404 rather than 403 — 403 would confirm the poll ID exists and belongs to someone else, leaking existence information. 404 makes "not yours" indistinguishable from "doesn't exist."
