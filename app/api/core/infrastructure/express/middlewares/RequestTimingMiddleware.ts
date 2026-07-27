import type { NextFunction, Request, Response } from 'express';
import { performance } from 'perf_hooks';

declare global {
  namespace Express {
    interface Request {
      startPerfMs: number;
    }
  }
}

const requestTimingMiddleware = (request: Request, _response: Response, next: NextFunction) => {
  request.startPerfMs = performance.now();
  next();
};

export { requestTimingMiddleware };
