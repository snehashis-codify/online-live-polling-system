import z from "zod";

export const activatePollInputSchema = z.object({
  durationMinutes: z
    .number()
    .int("Duration must be a whole number of minutes")
    .positive("Duration must be greater than 0")
    .max(10080, "Duration cannot exceed 7 days")
    .default(10),
});

export type ActivatePollInput = z.infer<typeof activatePollInputSchema>;
