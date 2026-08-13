import z from "zod";

const questionAnsSchema = z.object({
  quesId: z.uuid("Question ID must be a valid UUID"),
  optionId: z
    .array(z.uuid("Option ID must be a valid UUID"))
    .refine(
      (optionId) => new Set(optionId).size === optionId.length,
      { message: "Each option can only be selected once" },
    )
    .nullable(),
});

export const submitResponseInputSchema = z.object({
  questionAns: z
    .array(questionAnsSchema)
    .min(1, "At least one answer is required")
    .refine(
      (questionAns) =>
        new Set(questionAns.map((a) => a.quesId)).size === questionAns.length,
      { message: "Each question can only be answered once" },
    ),
});

export type SubmitResponseInput = z.infer<typeof submitResponseInputSchema>;
