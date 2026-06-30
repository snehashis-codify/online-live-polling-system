import type { NextFunction, Request, Response } from "express";
import AuthService from "./auth.service.js";

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
      res
        .status(200)
        .json({ message: "User logged in successfuly", data: response });
    } catch (error) {
      next(error);
    }
  }
}

export default AuthController;
