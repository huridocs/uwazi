import { NextFunction, Request, Response } from 'express';
import { TelemetryCollector } from '#api/core/libs/logger/TelemetryCollector.js';

declare global {
  namespace Express {
    interface Request {
      telemetryCollector: TelemetryCollector;
    }
  }
}

const telemetryMiddleware = (request: Request, _response: Response, next: NextFunction) => {
  request.telemetryCollector = new TelemetryCollector('http_request');
  next();
};

export { telemetryMiddleware };
