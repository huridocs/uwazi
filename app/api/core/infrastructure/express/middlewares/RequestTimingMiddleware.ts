import { NextFunction, Request, Response } from 'express';

declare global {
  namespace Express {
    interface Request {
      startTimeMs: number;
    }
  }
}

const requestTimingMiddleware = (request: Request, _response: Response, next: NextFunction) => {
  request.startTimeMs = Date.now();
  next();
};

export { requestTimingMiddleware };
