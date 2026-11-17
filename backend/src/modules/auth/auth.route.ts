import { Router } from "express";
import AuthController from "./auth.controller.js";
import { refreshMiddleware } from "./auth.middleware.js";

const router: Router = Router();
const authController = new AuthController();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/refresh", refreshMiddleware, authController.refresh);
router.post("/logout", refreshMiddleware, authController.logout);

export default router;
