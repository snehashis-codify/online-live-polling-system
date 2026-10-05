import type { Request, Response, NextFunction } from "express";
import { getUserId } from "../../common/util/cookie-auth.util.js";
import LiveService from "../live/live.service.js";
import { isPollOpen } from "../poll/util/isPollOpen.util.js";
import ApiError from "../../common/util/api-error.util.js";

export const authorisePollResults = async (
  req: Request<{ pollId: string }>,
  _res: Response,
  next: NextFunction,
) => {
  const { pollId } = req.params;
  const userId = getUserId(req);
  const liveService = new LiveService();
  const poll = await liveService.getPoll(pollId);
  if (!poll) throw ApiError.notFound("Poll not found");
  const isClosed = !isPollOpen(poll.expTime, poll.status);
  if (isClosed) {
    next();
  } else {
    if (!userId) throw ApiError.unAuthenticated();
    const isCreator = poll.creatorId === userId;
    if (!isCreator && !(await liveService.hasResponded(pollId, userId)))
      throw ApiError.forbidden("Submit a response to view results");
    next();
  }
};
