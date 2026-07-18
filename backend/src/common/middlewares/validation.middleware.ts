import type { Request, Response, NextFunction } from "express";
import type { ZodType } from "zod";
import ApiError from "../util/api-error.util.js";

type ValidationTarget = "body" | "params" | "query";

const validate = (schema: ZodType, target: ValidationTarget = "body") => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      const message = result.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("\n");
      throw ApiError.badRequest(message);
    }
    req[target] = result.data;
    next();
  };
};

export default validate;
