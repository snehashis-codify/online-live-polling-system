import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import JWTUtil from "../../common/util/jwt.util.js";
import db from "../../common/config/db.js";
import { usersTable } from "../../common/config/schema.js";
import { and, eq } from "drizzle-orm";
import ApiError from "../../common/util/api-error.util.js";
import { createHash } from "crypto";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from "../../common/util/auth-cookie.util.js";
const jwtUtil = new JWTUtil();

// Known auth failures (our ApiErrors, bad/expired JWTs) become 401;
// anything else (e.g. DB down) is passed on untouched so it surfaces as a 500
const toAuthError = (error: unknown) => {
  if (error instanceof ApiError) return error;
  // TokenExpiredError and NotBeforeError both extend JsonWebTokenError
  if (error instanceof jwt.JsonWebTokenError)
    return ApiError.unAuthenticated("Invalid or expired token");
  return error;
};

const authenticate = async (req: Request, _: Response, next: NextFunction) => {
  try {
    // Browser clients send the httpOnly cookie; the Bearer header is kept as a
    // fallback for API tools (Postman, curl) and non-browser clients
    let token = req.cookies?.[ACCESS_TOKEN_COOKIE] as string | undefined;
    if (!token) {
      const bearerToken = req.headers?.["authorization"] as string | undefined;
      if (!bearerToken) throw ApiError.unAuthenticated("Missing token");
      if (!bearerToken.startsWith("Bearer "))
        throw ApiError.unAuthenticated("Missing bearer");
      token = bearerToken.split(" ")[1];
    }
    if (!token) throw ApiError.unAuthenticated("Missing token");
    const decoded = jwtUtil.verifyAccessToken(token);
    if (!decoded || typeof decoded === "string")
      throw ApiError.unAuthenticated("Invalid token");

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, decoded.userId));
    if (!user) {
      throw ApiError.unAuthenticated("Unauthenticated");
    }
    (req as any).user = {
      id: user.id,
      name: user.name,
      email: user.email,
    };
    next();
  } catch (error) {
    next(toAuthError(error));
  }
};

export const refreshMiddleware = async (
  req: Request,
  _: Response,
  next: NextFunction,
) => {
  try {
    const token = req.cookies?.[REFRESH_TOKEN_COOKIE] as string | undefined;
    if (!token) throw ApiError.unAuthenticated("Missing refresh token");

    const decoded = jwtUtil.verifyRefreshToken(token);
    if (!decoded || typeof decoded === "string")
      throw ApiError.unAuthenticated("Invalid or expired token");

    const hashRefreshToken = createHash("sha256").update(token).digest("hex");
    const [user] = await db
      .select()
      .from(usersTable)
      .where(
        and(
          eq(usersTable.refreshToken, hashRefreshToken),
          eq(usersTable.id, decoded.userId),
        ),
      );
    if (!user) {
      // Valid signature but not the stored hash: already rotated or logged out
      throw ApiError.unAuthenticated("Unauthenticated");
    }
    (req as any).user = {
      id: user.id,
      name: user.name,
      email: user.email,
    };
    // Service uses this to rotate only if the token is still the current one
    (req as any).refreshTokenHash = hashRefreshToken;
    next();
  } catch (error) {
    next(toAuthError(error));
  }
};

export default authenticate;
