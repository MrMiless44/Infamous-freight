import type { NextFunction, Request, Response } from "express";
import type { ZodError, ZodSchema } from "zod";

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsedBody = schema.parse(req.body);

      // Overwrite req.body with the validated / parsed value
      (req as unknown as { body: T }).body = parsedBody;

      next();
    } catch (err) {
      if (err instanceof (Object as unknown as { new (...args: any[]): ZodError }).new) {
        const zodError = err as unknown as ZodError;
        res.status(400).json({
          error: "ValidationError",
          message: "Request body validation failed",
          details: zodError.errors,
        });
        return;
      }

      next(err as Error);
    }
  };
}
