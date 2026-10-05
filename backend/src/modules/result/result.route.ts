import express, { Router } from "express";
import validate from "../../common/middlewares/validation.middleware.js";
import { pollIdParamSchema } from "../../common/dto/pollId.dto.js";
import { authorisePollResults } from "./result.middleware.js";
import ResultController from "./result.controller.js";
const router: Router = express.Router();
const resultController = new ResultController();
router.get(
  "/:pollId",
  validate(pollIdParamSchema, "params"),
  authorisePollResults,
  resultController.getPollResults,
);

export default router;
