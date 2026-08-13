import express, { Router } from "express";
import validate from "../../common/middlewares/validation.middleware.js";
import { linkParamSchema } from "../poll/dto/link.dto.js";
import { authorizePublicPolls } from "../poll/poll.middleware.js";
import ResponseController from "./response.controller.js";
import { submitResponseInputSchema } from "./dto/submitResponse.dto.js";
import { checkMandatoryQuestionStatus, optionsRangeGuard, reSubmissionGuard } from "./response.middleware.js";
const router: Router = express.Router();
const responseController = new ResponseController();
router.post(
  "/submit/:link",
  validate(linkParamSchema, "params"),
  authorizePublicPolls,
  validate(submitResponseInputSchema, "body"),

  checkMandatoryQuestionStatus,
    optionsRangeGuard,
  reSubmissionGuard,
  responseController.submitResponse,
);

export default router;
