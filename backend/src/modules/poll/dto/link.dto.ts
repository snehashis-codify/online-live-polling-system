import z from "zod";

export const linkParamSchema = z.object({
  link: z.string().regex(/^[0-9a-f]{32}$/, "Invalid poll link"),
});

export type LinkParam = z.infer<typeof linkParamSchema>;
