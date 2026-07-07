# Polling System — Build Plan

Milestone checklist only — no schema fields, endpoint names, or architecture choices spelled out on purpose. Design those yourself as you go; that's the point of building it solo.

## Current state snapshot (2026-07-08)

**Backend**
- Auth: register + login working (password hashing, JWT access+refresh). Refresh/logout not done yet.
- Schema: `users → polls → questions → options`, plus `responses`/`answers` (one row per selected option, cascade FKs, partial unique index enforcing one editable response per authenticated user per poll). `questions.isMandatory`, `polls.responseMode` (anonymous/authenticated), `polls.isPublished` all in place. Migrated. Design rationale for all of it in `design-decisions.md`.
- Poll module: creation only. No list/get/update, no response submission, no analytics, no publish.
- No Socket.io yet.
- Phase 0 done. Phase 1 (auth refresh/logout/validation) deferred for now.

**Frontend**: not started.

---

## Phase 0 — Data model
Extend the schema to support: marking a question mandatory or optional, choosing anonymous vs. authenticated response mode per poll, tracking that a poll's results have been published, and storing each response plus the individual answers it contains. Migrate.

## Phase 1 — Finish auth
Add whatever's needed to issue a new access token from a refresh token, and to invalidate a session on logout. Validate register/login input.

## Phase 2 — Poll lifecycle (creator side)
Let a creator see their own polls, view one poll's detail, and move a poll from draft to active with an expiry. Make sure a poll stops accepting responses once expired.

## Phase 3 — Public access + submission
Let anyone with the link view an active poll's questions (respecting anonymous/authenticated mode). Accept a submission only if the poll is still open, every mandatory question is answered, and each question has exactly one selected option.

## Phase 4 — Analytics
Give the creator a view of total responses and a per-question breakdown of how each option was chosen.

## Phase 5 — Publish results
Let the creator publish a closed poll's results. Once published, the same public link should show the final outcome to anyone.

## Phase 6 — Real-time
Push live updates to the creator's dashboard as responses come in, using WebSockets/Socket.io.

## Phase 7 — Frontend
Auth pages, protected poll builder (dynamic questions/options, mandatory + anonymous toggles, expiry), public answer form, live creator dashboard, public results page.

## Phase 8 — Wrap-up
README, deployment.
