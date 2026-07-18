import z from "zod";
import { quesTypeEnum, type optionsTable, type questionTable } from "../../../common/config/schema.js";


const optionSchema = z.object({
  id: z.uuid("Option ID must be a valid UUID"),
  title: z.string().min(1, "Option title cannot be empty"),
  value: z.string().min(1, "Option value cannot be empty"),
});

const questionSchema = z.object({
  questionTitle: z.string().min(1, "Question title cannot be empty"),
  questionType: z.enum(quesTypeEnum.enumValues, {
    error: "Question type must be 'radio' or 'checkbox'",
  }).default("radio"),
  options: z.array(optionSchema).min(2, "Each question must have at least 2 options"),
});

export const createPollInputSchema = z.object({
  title: z.string().min(1, "Poll title cannot be empty"),
  questions: z.array(questionSchema).min(1, "Poll must have at least one question"),
});

export const createPollOutputSchema = z.object({
  pollId: z.uuid("Poll ID must be a valid UUID"),
  sharedLink: z.url("Shared link must be a valid URL"),
})

export type questionTableInsertType=typeof questionTable.$inferInsert 
export type optionTableInsertType=typeof optionsTable.$inferInsert
export type CreatePollInput = z.infer<typeof createPollInputSchema>;
export type CreatePollOutput = z.infer<typeof createPollOutputSchema>;
