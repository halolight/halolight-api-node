import { AnyZodObject, ZodError } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { errorResponse } from './response';

type ValidateTarget = 'body' | 'query' | 'params';

export const validate = (schema: AnyZodObject, target: ValidateTarget = 'body') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await schema.parseAsync(req[target]);
      req[target] = data;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json(
          errorResponse('Validation failed', JSON.stringify(err.flatten().fieldErrors))
        );
        return;
      }
      next(err);
    }
  };
};
