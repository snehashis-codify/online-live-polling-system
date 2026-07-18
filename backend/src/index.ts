import express from "express";
import type { Express } from "express";
import authRouter from "./modules/auth/auth.route.js";
import pollRouter from "./modules/poll/poll.route.js"
import globalErrorHandler from "./common/middlewares/error.middleware.js";
function createApplication(): Express {
  const app = express();
  app.use(express.json());
  //middlewares

  //routes
  app.get("/health-route", (_, res) => {
    res.status(200).json({ ok: true });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/poll",pollRouter)
  app.use(globalErrorHandler)
  return app;
}

export default createApplication;
