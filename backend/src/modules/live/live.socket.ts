import { STATUS_CODES } from "http";
import type { IncomingMessage, Server } from "http";
import type { Duplex } from "stream";
import { WebSocket, WebSocketServer } from "ws";
import { z } from "zod";
import { getUserId } from "../../common/util/cookie-auth.util.js";
import ApiError from "../../common/util/api-error.util.js";
import { isPollOpen } from "../poll/util/isPollOpen.util.js";
import LiveService from "./live.service.js";

export interface LiveConnectionContext {
  pollId: string;
  userId: string;
}

const LIVE_PATH = "/results";
const HEARTBEAT_INTERVAL_MS = 30_000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? "http://localhost:3000";
// Custom close code (4000-4999 range is reserved for applications)
export const POLL_CLOSED_CODE = 4000;

const liveService = new LiveService();

// pollId → sockets watching that poll's live results.
// In-memory, so this assumes a single server instance.
const rooms = new Map<string, Set<WebSocket>>();

// Sockets that answered the last heartbeat ping
const aliveSockets = new WeakSet<WebSocket>();

const joinRoom =(pollId: string, ws: WebSocket) => {
  let room = rooms.get(pollId);
  if (!room) {
    room = new Set();
    rooms.set(pollId, room);
  }
  room.add(ws);
};

const leaveRoom = (pollId: string, ws: WebSocket) => {
  // Room may already be gone if closeRoom tore it down
  const room = rooms.get(pollId);
  if (!room) return;
  room.delete(ws);
  if (room.size === 0) rooms.delete(pollId);
};

// Pushes a message to everyone watching this poll. No-op if nobody is watching.
export const broadcastToPoll = (pollId: string, payload: unknown) => {
  const room = rooms.get(pollId);
  if (!room) return;
  // Serialize once, not once per socket
  const message = JSON.stringify(payload);
  for (const ws of room) {
    // Skip sockets mid-close; their close handler will remove them from the room
    if (ws.readyState === WebSocket.OPEN) ws.send(message);
  }
};

// Called when a poll closes (expiry job / manual close). No-op if nobody is watching.
export const closeRoom = (pollId: string) => {
  const room = rooms.get(pollId);
  if (!room) return;
  // Delete first so each socket's own close handler finds no room to leave
  rooms.delete(pollId);
  for (const ws of room) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.close(POLL_CLOSED_CODE, "poll_closed");
    }
  }
};

// Upgrade requests never reach Express, so globalErrorHandler can't respond here.
// No WebSocket exists yet either, so the rejection is raw HTTP on the TCP socket,
// using the same body shape as globalErrorHandler.
const rejectUpgrade = (socket: Duplex, error: unknown) => {
  console.log(error);
  const isApiError = error instanceof ApiError;
  const statusCode = isApiError ? error.statusCode : 500;
  const body = JSON.stringify(
    isApiError
      ? { success: false, errors: error.message.split("\n") }
      : { success: false, message: "Internal Server Error" },
  );
  socket.write(
    `HTTP/1.1 ${statusCode} ${STATUS_CODES[statusCode]}\r\n` +
      "Connection: close\r\n" +
      "Content-Type: application/json\r\n" +
      `Content-Length: ${Buffer.byteLength(body)}\r\n\r\n` +
      body,
  );
  socket.destroy();
};

const authorizeUpgrade = async (req: IncomingMessage) => {
  const url = new URL(req.url ?? "", "http://localhost");
  if (url.pathname !== LIVE_PATH) throw ApiError.notFound();

  // CORS doesn't apply to WebSockets; guards against cross-site socket hijacking
  if (req.headers.origin !== CLIENT_ORIGIN)
    throw ApiError.forbidden("Origin not allowed");

  const parsedPollId = z.uuid().safeParse(url.searchParams.get("pollId"));
  if (!parsedPollId.success) throw ApiError.badRequest("Invalid pollId");
  const pollId = parsedPollId.data;

  const userId = getUserId(req);
  if (!userId || !(await liveService.userExists(userId)))
    throw ApiError.unAuthenticated();

  const poll = await liveService.getPoll(pollId);
  if (!poll) throw ApiError.notFound("Poll not found");

  const isCreator = poll.creatorId === userId;
  if (!isCreator && !(await liveService.hasResponded(pollId, userId)))
    throw ApiError.forbidden("Submit a response to view live results");

  return { pollId, userId, poll };
};

const attachLiveResults = (server: Server) => {
  const wss = new WebSocketServer({ noServer: true });

  wss.on(
    "connection",
    (ws: WebSocket, _req: IncomingMessage, { pollId }: LiveConnectionContext) => {
      joinRoom(pollId, ws);
      aliveSockets.add(ws);
      ws.on("pong", () => aliveSockets.add(ws));
      // Unhandled socket errors would crash the process; close fires after error anyway
      ws.on("error", console.error);
      ws.on("close", () => leaveRoom(pollId, ws));
    },
  );

  // Connections that drop without a close frame (e.g. phone loses signal) never fire
  // "close" on their own. Ping everyone periodically; anyone who missed the last pong
  // is terminated, which fires "close" and removes them from their room.
  const heartbeat = setInterval(() => {
    for (const ws of wss.clients) {
      if (!aliveSockets.has(ws)) {
        ws.terminate();
        continue;
      }
      aliveSockets.delete(ws);
      ws.ping();
    }
  }, HEARTBEAT_INTERVAL_MS);
  wss.on("close", () => clearInterval(heartbeat));

  server.on(
    "upgrade",
    async (req: IncomingMessage, socket: Duplex, head: Buffer) => {
      // Client dropping mid-handshake would otherwise crash the process
      socket.on("error", console.error);
      try {
        const { pollId, userId, poll } = await authorizeUpgrade(req);

        wss.handleUpgrade(req, socket, head, (ws: WebSocket) => {
          // Browsers can't read HTTP status on a failed upgrade, but they do get close codes,
          // so a closed poll is accepted then closed to let the client fall back to REST
          if (!isPollOpen(poll.expTime, poll.status)) {
            ws.close(POLL_CLOSED_CODE, "poll_closed");
            return;
          }
          const context: LiveConnectionContext = { pollId, userId };
          wss.emit("connection", ws, req, context);
        });
      } catch (error) {
        rejectUpgrade(socket, error);
      }
    },
  );

  return wss;
};

export default attachLiveResults;
