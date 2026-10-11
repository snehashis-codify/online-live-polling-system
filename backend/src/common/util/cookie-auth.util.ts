import type { IncomingMessage } from "http";
import JWTUtil from "./jwt.util.js";

const jwtUtil = new JWTUtil();

// Parses the raw header so it also works on WebSocket upgrade requests,
// which bypass Express (and therefore cookie-parser)
const getCookie = (req: IncomingMessage, name: string) => {
  const header = req.headers.cookie;
  if (!header) return undefined;
  for (const pair of header.split(";")) {
    const [key, ...rest] = pair.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return undefined;
};

export const getUserId = (req: IncomingMessage) => {
  const token = getCookie(req, "accessToken");
  if (!token) return undefined;
  try {
    const decoded = jwtUtil.verifyAccessToken(token);
    if (!decoded || typeof decoded === "string") return undefined;
    return decoded.userId as string | undefined;
  } catch {
    return undefined;
  }
};
