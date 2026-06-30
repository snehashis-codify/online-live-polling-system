import type { NextFunction, Request, Response } from "express";
import PollService from "./poll.service.js";
const pollService = new PollService();
class PollController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const response = await pollService.create(req.body, (req as any).user);
      if (!response) return next(new Error("Poll creation failed"));
      return res.status(201).json({ message: "Poll created successfully", data: response });
    } catch (error) {
      next(error);
    }
  }
}
export default PollController;
