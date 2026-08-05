import z from "zod";
import { responseModeEnum } from "../../../common/config/schema.js";
import { optionSchema, questionSchema } from "./getPollDetail.dto.js";

export const getPublicPollDetailOutputSchema = z.object({
  id: z.uuid("Poll ID must be a valid UUID"),
  title: z.string().min(1, "Poll title cannot be empty"),
  responseMode: z.enum(responseModeEnum.enumValues, {
    error: "Response mode must be 'anonymous' or 'authenticated'",
  }),
  expTime: z.date().nullable(),
  isOpen: z.boolean(),
  questions: z.array(questionSchema),
});

export type GetPublicPollDetailOutput = z.infer<
  typeof getPublicPollDetailOutputSchema
>;
