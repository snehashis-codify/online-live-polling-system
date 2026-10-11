import type { NextFunction, Request, Response } from "express";
import AuthService from "./auth.service.js";
import ms, { type StringValue } from "ms";

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
      const response = await authService.login(req.body);
      res.cookie("accessToken", response.accessToken, {
        httpOnly: true, // JS can't read it
        secure: process.env.NODE_ENV === "production", // HTTPS only in prod
        sameSite: "lax", // "none" + secure only if frontend is on a different site
        path: "/",
        maxAge: ms(process.env.ACCESS_TOKEN_EXP as StringValue), // match ACCESS_TOKEN_EXP
      });
      res
        .status(200)
        .json({ message: "User logged in successfuly", data: response });
    } catch (error) {
      next(error);
    }
  }
}

export default AuthController;
