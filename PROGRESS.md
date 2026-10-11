# Progress

## Phase 6: Live results (branch `phase-6-live-results`)

_Last updated: 2026-10-01. Everything below is uncommitted unless noted._

### Done

- **Live socket** (`backend/src/modules/live/live.socket.ts`, `live.service.ts`), built on raw `ws`:
  - auth on connect: `accessToken` cookie + `pollId` query param
  - only the poll's creator or someone who has responded can join
  - in-memory rooms map, 30s heartbeat, `broadcastToPoll`, `closeRoom`, `POLL_CLOSED_CODE = 4000`
- **Auth cookie**: login sets an httpOnly `accessToken` cookie (a browser `WebSocket` can't send headers). `index.ts` adds `cookie-parser`, CORS with credentials for `localhost:3000`, and mounts `/api/result`.
- **Resubmission**: `response.service.ts` updates the user's existing response and replaces its answers instead of inserting a duplicate.
- **Shared DTO**: `pollId.dto.ts` moved to `backend/src/common/dto/`.
- **Result access middleware** (`backend/src/modules/result/result.middleware.ts`, `authoRisePollResults`):
  - poll not found → 404
  - closed poll → allowed (final results are public)
  - open poll → 401 if not logged in, 403 unless the user is the creator or has responded
- **Cookie auth util**: `getCookie`/`getUserId` moved from `live.socket.ts` to `backend/src/common/util/cookie-auth.util.ts`. Both the socket and the result middleware use it.

### Next (in order)

1. Export `authoRisePollResults`; it isn't exported yet.
2. `result.service.getPollResults(pollId)`: for each question, each option with its count (options with 0 included, so join from options to answers and group by option), plus the total number of responses. `pushResults` will reuse the same shape.
3. `result.controller` + route: `validate(pollIdParamSchema, "params")` → `authoRisePollResults` → controller.
4. `pushResults(pollId)` in the live module (recount + `broadcastToPoll`), called fire-and-forget after the submit transaction commits, not from a background job.
5. Inngest expiry job that calls `closeRoom`.
6. Update `design-decisions.md`: it still says Socket.io, but the code uses raw `ws`.
7. Test against a real user and poll in the DB; those paths are untested.

### Small fixes not done yet

- Result middleware has no `userExists` check (the socket has one).
- `new LiveService()` is created per request; move it to module level.
- Unused `res` param could be `_`.
- Rename `authoRisePollResults` → `authorizePollResults`.
