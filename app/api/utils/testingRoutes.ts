import bodyParser from 'body-parser';
import express, { Application, Request, Response, NextFunction } from 'express';
import { Response as SuperTestResponse } from 'supertest';

import errorHandlingMiddleware from 'api/utils/error_handling_middleware';

declare global {
  namespace Express {
    export interface Request {
      getCurrentSessionSockets: Function;
    }
  }
}

const iosocket = jasmine.createSpyObj('socket', ['emit']);

const setUpApp = (route: Function): Application => {
  const app: Application = express();
  app.use(bodyParser.json());
  app.use((req: Request, _res: Response, next: NextFunction) => {
    req.getCurrentSessionSockets = () => ({ sockets: [iosocket], emit: iosocket.emit });
    next();
  });
  route(app);
  app.use(errorHandlingMiddleware);
  return app;
};

interface requestCb {
  (): Promise<SuperTestResponse>;
}
const socketEmit = async (eventName: string, performRequest: requestCb) => {
  const eventEmited = new Promise(resolve => {
    iosocket.emit.and.callFake((event: string) => {
      if (event === eventName) {
        resolve();
      }
    });
  });

  const res: SuperTestResponse = await performRequest();
  if (res.error) {
    throw res.error;
  }

  await eventEmited;

  return res;
};

export { setUpApp, socketEmit, iosocket };
