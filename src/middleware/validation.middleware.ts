import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodObject } from 'zod';

export const validate =
  (schema: ZodObject<any, any>) => async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          error: 'Validation Error',
          details: error.issues,
        });
      } else {
        res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid request data',
        });
      }
    }
  };
