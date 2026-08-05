import z from "zod";

const answerSchema = z.object({
  questionId: z.uuid("Question ID must be a valid UUID"),
  optionId: z.uuid("Option ID must be a valid UUID"),
});

export const submitResponseInputSchema = z.object({
  answers: z
    .array(answerSchema)
    .min(1, "At least one answer is required")
    .refine(
      (answers) =>
        new Set(answers.map((a) => a.questionId)).size === answers.length,
      { message: "Each question can only be answered once" },
    ),
});

export type SubmitResponseInput = z.infer<typeof submitResponseInputSchema>;
