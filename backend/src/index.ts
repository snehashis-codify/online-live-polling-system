import express from "express";
import cors from "cors";
import type { Express } from "express";
import authRouter from "./modules/auth/auth.route.js";
import pollRouter from "./modules/poll/poll.route.js";
import responseRouter from "./modules/response/response.route.js";
import resultRouter from "./modules/result/result.route.js";
import globalErrorHandler from "./common/middlewares/error.middleware.js";
import cookieParser from "cookie-parser";
function createApplication(): Express {
  const app = express();
  app.use(cookieParser());
  app.use(cors({ credentials: true, origin: "http://localhost:3000" }));
  app.use(express.json());
  //middlewares

  //routes
  app.get("/health-route", (_, res) => {
    res.status(200).json({ ok: true });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/poll", pollRouter);
  app.use("/api/response", responseRouter);
  app.use("/api/result", resultRouter);
  app.use(globalErrorHandler);
  return app;
}

export default createApplication;
