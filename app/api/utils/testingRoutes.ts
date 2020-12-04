import bodyParser from 'body-parser';
import express, { Application, Request, Response, NextFunction } from 'express';
import { Response as SuperTestResponse } from 'supertest';

import errorHandlingMiddleware from 'api/utils/error_handling_middleware';
import languageMiddleware from 'api/utils/languageMiddleware';

const iosocket = jasmine.createSpyObj('socket', ['emit']);

const setUpApp = (
  route: Function,
  ...customMiddleware: ((req: Request, _es: Response, next: NextFunction) => void)[]
): Application => {
  const app: Application = express();
  app.use(bodyParser.json());
  app.use((req: Request, _res: Response, next: NextFunction) => {
    req.emitToSessionSocket = (event: string, ...args: any[]) => iosocket.emit(event, ...args);
    next();
  });

  app.use(languageMiddleware);
  customMiddleware.forEach(middlewareElement => app.use(middlewareElement));

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
    throw new Error(res.error.text);
  }

  await eventEmited;

  return res;
};

export { setUpApp, socketEmit, iosocket };
