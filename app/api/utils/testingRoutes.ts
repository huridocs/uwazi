import bodyParser from 'body-parser';
import express, { Application, Request, Response, NextFunction } from 'express';
import { Response as SuperTestResponse } from 'supertest';

import errorHandlingMiddleware from 'api/utils/error_handling_middleware';
import languageMiddleware from 'api/utils/languageMiddleware';
import { routesErrorHandler } from 'api/utils/routesErrorHandler';
import { extendSupertest } from './supertestExtensions';

extendSupertest();

const iosocket = { emit: jasmine.createSpy('emit') };

const setUpApp = (
  route: Function,
  ...customMiddleware: ((req: Request, _es: Response, next: NextFunction) => void)[]
): Application => {
  const app: Application = express();
  routesErrorHandler(app);
  app.use(bodyParser.json());
  app.use((req: Request, _res: Response, next: NextFunction) => {
    req.emitToSessionSocket = (event: string, ...args: any[]) => iosocket.emit(event, ...args);
    req.sockets = {
      emitToCurrentTenant: (event: string, ...args: any[]) => iosocket.emit(event, ...args),
    };
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
        resolve(event);
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
