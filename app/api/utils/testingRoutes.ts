import express, { Application, NextFunction, Request, Response } from 'express';
import { Response as SuperTestResponse } from 'supertest';

import * as setupSockets from '#api/socketio/setupSockets.js';
import errorHandlingMiddleware from '#api/utils/error_handling_middleware.js';
import languageMiddleware from '#api/utils/languageMiddleware.js';
import { routesErrorHandler } from '#api/utils/routesErrorHandler.js';
import { appContext } from './AppContext.js';
import { extendSupertest } from './supertestExtensions.js';
import { dependenciesContextMiddleware } from '#api/core/infrastructure/express/middlewares/DependenciesMiddleware.js';
import { telemetryMiddleware } from '#api/core/infrastructure/express/middlewares/TelemetryMiddleware.js';

extendSupertest();

const iosocket = { emit: jest.fn() };

enum TestEmitSources {
  session = 'session',
  currentTenant = 'currentTenant',
}

const setUpApp = (
  route: Function,
  ...customMiddleware: ((req: Request, _es: Response, next: NextFunction) => void)[]
): Application => {
  jest
    .spyOn(setupSockets, 'emitToTenant')
    .mockImplementation((_tenant: string, event: string, ...args: any[]) => {
      iosocket.emit(event, TestEmitSources.currentTenant, ...args);
    });
  const app: Application = express();
  routesErrorHandler(app);
  app.use((req: Request, _res: Response, next: NextFunction) => {
    req.emitToSessionSocket = (event: string, ...args: any[]) =>
      iosocket.emit(event, TestEmitSources.session, ...args);
    req.sockets = {
      emitToCurrentTenant: (event: string, ...args: any[]) =>
        iosocket.emit(event, TestEmitSources.currentTenant, ...args),
    };
    next();
  });
  app.use((_req: Request, _res: Response, next: NextFunction) => {
    appContext
      .run(
        async () => {
          next();
        },
        { requestId: '1234' }
      )
      .catch(next);
  });
  app.use(languageMiddleware);
  app.use(telemetryMiddleware);
  customMiddleware.forEach(middlewareElement => app.use(middlewareElement));
  app.use(dependenciesContextMiddleware);

  route(app);
  app.use(errorHandlingMiddleware);
  return app;
};

interface requestCb {
  (): Promise<SuperTestResponse>;
}
const socketEmit = async (eventName: string, performRequest: requestCb) => {
  const eventEmited = new Promise(resolve => {
    iosocket.emit.mockImplementation((event: string) => {
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

export { iosocket, setUpApp, socketEmit, TestEmitSources };
