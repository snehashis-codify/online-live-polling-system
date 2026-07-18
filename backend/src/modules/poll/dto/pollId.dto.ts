import z from "zod";

export const pollIdParamSchema = z.object({
  pollId: z.uuid("Poll ID must be a valid UUID"),
});

export type PollIdParam = z.infer<typeof pollIdParamSchema>;
