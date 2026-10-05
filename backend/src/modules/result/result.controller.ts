import type { Request, Response, NextFunction } from "express";
import ResultService from "./result.service.js";
const resultService = new ResultService();
class ResultController {
  async getPollResults(
    req: Request<{ pollId: string }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
        const {pollId}=req.params
      await resultService.getPollResults();
    } catch (error) {
      next(error);
    }
  }
}
export default ResultController;
