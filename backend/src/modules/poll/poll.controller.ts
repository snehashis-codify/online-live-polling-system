import type { NextFunction, Request, Response } from "express";
import PollService from "./poll.service.js";
import ApiError from "../../common/util/api-error.util.js";
import ApiResponse from "../../common/util/api-response.util.js";
const pollService = new PollService();
class PollController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const response = await pollService.create(req.body, (req as any).user);
      if (!response) {
        throw ApiError.conflict("Error while creating poll");
      }
      ApiResponse.created(res, response, "Poll created successfully");
    } catch (error) {
      next(error);
    }
  }
  async getAllPolls(req: Request, res: Response, next: NextFunction) {
    try {
      const response = await pollService.getAllPolls((req as any).user);

      ApiResponse.ok(res, response, "Poll list fetched successfully");
    } catch (error) {
      next(error);
    }
  }
  async getPollDetails(
    req: Request<{ pollId: string }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { pollId } = req.params;
      const response = await pollService.getPollDetails(pollId);
      if (!response) {
        throw ApiError.notFound("Poll not found");
      }
      ApiResponse.ok(res, response, "Poll details fetched successfully");
    } catch (error) {
      next(error);
    }
  }
  async activatePoll(
    req: Request<{ pollId: string }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { pollId } = req.params;

      await pollService.activatePoll(req.body, pollId);
      ApiResponse.ok(res, null, "Poll is activated");
    } catch (error) {
      next(error);
    }
  }
}
export default PollController;
