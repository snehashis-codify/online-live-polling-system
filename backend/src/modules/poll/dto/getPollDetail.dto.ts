import z from "zod";
import {
  pollStatusEnum,
  quesTypeEnum,
  responseModeEnum,
} from "../../../common/config/schema.js";

const optionSchema = z.object({
  id: z.uuid("Option ID must be a valid UUID"),
  title: z.string().min(1, "Option title cannot be empty"),
  value: z.string().min(1, "Option value cannot be empty"),
});

const questionSchema = z.object({
  id: z.uuid("Question ID must be a valid UUID"),
  questionTitle: z.string().min(1, "Question title cannot be empty"),
  questionType: z.enum(quesTypeEnum.enumValues, {
    error: "Question type must be 'radio' or 'checkbox'",
  }),
  isMandatory: z.boolean(),
  options: z.array(optionSchema),
});

export const getPollDetailOutputSchema = z.object({
  id: z.uuid("Poll ID must be a valid UUID"),
  title: z.string().min(1, "Poll title cannot be empty"),
  status: z.enum(pollStatusEnum.enumValues, {
    error: "Status must be 'draft', 'active' or 'closed'",
  }),
  responseMode: z.enum(responseModeEnum.enumValues, {
    error: "Response mode must be 'anonymous' or 'authenticated'",
  }),
  expTime: z.date().nullable(),
  isOpen: z.boolean(),
  sharedLink: z.url("Shared link must be a valid URL"),
  questions: z.array(questionSchema),
});

export type GetPollDetailOutput = z.infer<typeof getPollDetailOutputSchema>;
