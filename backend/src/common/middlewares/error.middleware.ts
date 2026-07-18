import type { NextFunction, Request, Response } from "express";
import ApiError from "../util/api-error.util.js";

const globalErrorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
    console.log(err)
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      errors: err.message.split("\n"),
    });
  }
  return res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
};

export default globalErrorHandler;
