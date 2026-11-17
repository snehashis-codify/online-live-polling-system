import type { Request, Response, NextFunction } from "express";
import ResultService from "./result.service.js";
import ApiResponse from "../../common/util/api-response.util.js";
const resultService = new ResultService();
class ResultController {
  async getPollResults(
    req: Request<{ pollId: string }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { pollId } = req.params;
      const row = await resultService.getPollResults(pollId);
       ApiResponse.ok(res, row, "Poll results fetched successfully");
    } catch (error) {
      next(error);
    }
  }
}
export default ResultController;
