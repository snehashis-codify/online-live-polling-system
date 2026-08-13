import type { NextFunction, Request, Response } from "express";
import ResponseService from "./response.service.js";
import ApiResponse from "../../common/util/api-response.util.js";
const responseService = new ResponseService();
class ResponseController {
  async submitResponse(req: Request, res: Response, next: NextFunction) {
    try {
      const pollDetails = req.poll!;
      const userDetails = req.user;
      const response = await responseService.submitResponse(
        pollDetails.id,
        userDetails,
        req.body,
      );
      ApiResponse.ok(res, response, "Response submitted successfully");
    } catch (error) {
      next(error);
    }
  }
}

export default ResponseController;
