import type { NextFunction, Request, Response } from "express";
import AuthService from "./auth.service.js";
import ApiResponse from "../../common/util/api-response.util.js";
import {
  clearAuthCookies,
  setAuthCookies,
} from "../../common/util/auth-cookie.util.js";

const authService = new AuthService();
class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const response = await authService.register(req.body);
      res
        .status(200)
        .json({ message: "User registration successful", data: response });
    } catch (error) {
      next(error);
    }
  }
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { accessToken, refreshToken, ...user } = await authService.login(
        req.body,
      );
      // Tokens live only in httpOnly cookies, never in the body
      setAuthCookies(res, { accessToken, refreshToken });
      ApiResponse.ok(res, user, "User logged in successfully");
    } catch (error) {
      next(error);
    }
  }
  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { accessToken, refreshToken } = await authService.refresh(
        (req as any).user,
        (req as any).refreshTokenHash,
      );
      setAuthCookies(res, { accessToken, refreshToken });
      ApiResponse.ok(res, null, "Session refreshed successfully");
    } catch (error) {
      next(error);
    }
  }
  // Guarded by refreshMiddleware: missing/expired/rotated refresh token → 401
  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      await authService.logout((req as any).user.id);
      clearAuthCookies(res);
      ApiResponse.ok(res, null, "User logged out successfully");
    } catch (error) {
      next(error);
    }
  }
}

export default AuthController;
