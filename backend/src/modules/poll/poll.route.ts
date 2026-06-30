import { Router } from "express";
import PollController from "./poll.controller.js";
import authenticate from "../auth/auth.middleware.js";
import validate from "../../common/middlewares/validation.middleware.js";
import { createPollInputSchema } from "./poll.model.js";

const router: Router = Router();
const pollController = new PollController();
router.post("/create", authenticate, validate(createPollInputSchema), pollController.create);
// router.patch("/update/:poll_id");
// router.get("/get-all-polls");
// router.get("/get/:poll_id");
// router.delete("/delete/:poll_id");

export default router;
