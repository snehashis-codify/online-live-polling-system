import z from "zod";
import { pollStatusEnum } from "../../../common/config/schema.js";

export const getPollsOutputSchema = z.array(
  z.object({
    id: z.uuid("Poll ID must be a valid UUID"),
    title: z.string().min(1, "Poll title cannot be empty"),
    status: z.enum(pollStatusEnum.enumValues, {
      error: "Status must be 'draft', 'active' or 'closed'",
    }),
    expTime: z.date().nullable(),
  }),
);

export type GetPollsOutput = z.infer<typeof getPollsOutputSchema>;
