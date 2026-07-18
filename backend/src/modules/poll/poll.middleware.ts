import type { Request, Response, NextFunction } from "express";
import db from "../../common/config/db.js";
import { pollTable } from "../../common/config/schema.js";
import { and, eq } from "drizzle-orm";
import ApiError from "../../common/util/api-error.util.js";
const authorizeOwnedPolls = () => {
  return async (
    req: Request<{ pollId: string }>,
    res: Response,
    next: NextFunction,
  ) => {
    const { id } = (req as any).user;
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

export default authorizeOwnedPolls;
