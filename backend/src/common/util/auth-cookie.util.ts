import type { CookieOptions, Response } from "express";
import ms, { type StringValue } from "ms";

export const ACCESS_TOKEN_COOKIE = "accessToken";
export const REFRESH_TOKEN_COOKIE = "refreshToken";
// Refresh cookie is only sent to /api/auth/* (refresh + logout), never to
// normal API calls
const REFRESH_TOKEN_PATH = "/api/auth";

const baseOptions: CookieOptions = {
  httpOnly: true, // JS can't read it
  secure: process.env.NODE_ENV === "production", // HTTPS only in prod
  sameSite: "lax", // "none" + secure only if frontend is on a different site
};

export const setAuthCookies = (
  res: Response,
  tokens: { accessToken: string; refreshToken: string },
) => {
  res.cookie(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
    ...baseOptions,
    path: "/",
    maxAge: ms(process.env.ACCESS_TOKEN_EXP as StringValue),
  });
  res.cookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
    ...baseOptions,
    path: REFRESH_TOKEN_PATH,
    maxAge: ms(process.env.REFRESH_TOKEN_EXP as StringValue),
  });
};

export const clearAuthCookies = (res: Response) => {
  res.clearCookie(ACCESS_TOKEN_COOKIE, { ...baseOptions, path: "/" });
  res.clearCookie(REFRESH_TOKEN_COOKIE, {
    ...baseOptions,
    path: REFRESH_TOKEN_PATH,
  });
};
