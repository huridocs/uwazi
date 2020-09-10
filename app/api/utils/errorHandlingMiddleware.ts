import { NextFunction, Response, Request } from 'express';
import { handleError } from './handleError';

const errorHandlingMiddleware = (error: any, req: Request, res: Response, next: NextFunction) => {
  const handled = handleError(error, { req });

  const { message, code, ...rest } = handled;

  res.status(code);
  res.json({ error: message, ...rest });

  next();
};

export { errorHandlingMiddleware };
