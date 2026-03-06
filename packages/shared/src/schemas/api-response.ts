import { z } from "zod";

export const apiErrorSchema = z.object({
  message: z.string(),
  code: z.string().optional()
});

export const apiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    ok: z.boolean(),
    data: dataSchema.optional(),
    error: apiErrorSchema.optional()
  });
