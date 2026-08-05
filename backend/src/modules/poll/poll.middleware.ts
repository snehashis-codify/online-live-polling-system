import type { Request, Response, NextFunction } from "express";
import db from "../../common/config/db.js";
import { pollTable } from "../../common/config/schema.js";
import { and, eq } from "drizzle-orm";
import ApiError from "../../common/util/api-error.util.js";
import { isPollOpen } from "./util/isPollOpen.util.js";
import authenticate from "../auth/auth.middleware.js";
const authorizeOwnedPolls = () => {
  return async (
    req: Request<{ pollId: string }>,
    res: Response,
    next: NextFunction,
  ) => {
    const { id } = req?.user!;
    const { pollId } = req.params;
    const isValidCreator = await db
      .select()
      .from(pollTable)
      .where(and(eq(pollTable.id, pollId), eq(pollTable.creatorId, id)));
    if (isValidCreator.length <= 0) {
      throw ApiError.notFound("Only creator of the poll should get the access");
    }
    next();
  };
};

const authorizePublicPolls = async (
  req: Request<{ link: string }>,
  res: Response,
  next: NextFunction,
) => {
  const { link } = req.params;
  const [pollDetails] = await db
    .select()
    .from(pollTable)
    .where(eq(pollTable.linkToken, link));
  if (!pollDetails) throw ApiError.notFound("Invalid link, try again");
  const { status, expTime, responseMode } = pollDetails;
  if (!isPollOpen(expTime, status))
    throw ApiError.forbidden("The poll is not active");
  req.poll = pollDetails;
  if (responseMode === "authenticated") return authenticate(req, res, next);

  next();
};

export { authorizeOwnedPolls, authorizePublicPolls };
