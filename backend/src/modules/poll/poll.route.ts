import { Router } from "express";
import PollController from "./poll.controller.js";
import authenticate from "../auth/auth.middleware.js";
import validate from "../../common/middlewares/validation.middleware.js";
import { createPollInputSchema } from "./dto/createPoll.dto.js";
import { pollIdParamSchema } from "./dto/pollId.dto.js";
import { activatePollInputSchema } from "./dto/activatePoll.dto.js";
import {
  authorizeOwnedPolls,
  authorizePublicPolls,
} from "./poll.middleware.js";
import { linkParamSchema } from "./dto/link.dto.js";

const router: Router = Router();
const pollController = new PollController();
router.post(
  "/create",
  authenticate,
  validate(createPollInputSchema),
  pollController.create,
);
router.get("/get-all-polls", authenticate, pollController.getAllPolls);
router.get(
  "/get/:pollId",
  authenticate,
  validate(pollIdParamSchema, "params"),
  authorizeOwnedPolls(),
  pollController.getPollDetails,
);
router.patch(
  "/activate/:pollId",
  authenticate,
  validate(pollIdParamSchema, "params"),
  authorizeOwnedPolls(),
  validate(activatePollInputSchema, "body"),
  pollController.activatePoll,
);

router.get(
  "/public/:link",
  validate(linkParamSchema, "params"),
  authorizePublicPolls,
  pollController.getPublicPollDetails,
);
// router.patch("/update/:poll_id");
// router.delete("/delete/:poll_id");

export default router;
