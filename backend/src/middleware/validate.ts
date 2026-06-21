import type { Request, Response, NextFunction } from "express";
import type { ZodSchema } from "zod";

interface ValidateOptions {
  status?: number;
  formatError?: (message: string) => unknown;
}

const defaultFormat = (message: string) => ({ error: message });

export function validate(schema: ZodSchema, options?: ValidateOptions) {
  const status = options?.status ?? 400;
  const formatError = options?.formatError ?? defaultFormat;

  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(status).json(formatError(result.error.issues[0].message));
      return;
    }
    req.body = result.data;
    next();
  };
}
