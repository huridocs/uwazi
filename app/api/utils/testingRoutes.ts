/* eslint-disable max-statements */
import express, { Application, NextFunction, Request, Response } from 'express';
import { Response as SuperTestResponse } from 'supertest';

import * as setupSockets from '#api/socketio/setupSockets.js';
import errorHandlingMiddleware from '#api/utils/error_handling_middleware.js';
import languageMiddleware from '#api/utils/languageMiddleware.js';
import { routesErrorHandler } from '#api/utils/routesErrorHandler.js';
import { appContext } from './AppContext.js';
import { extendSupertest } from './supertestExtensions.js';
import { dependenciesContextMiddleware } from '#api/core/infrastructure/express/middlewares/DependenciesMiddleware.js';
import { requestTimingMiddleware } from '#api/core/infrastructure/express/middlewares/RequestTimingMiddleware.js';
import { authenticatedUserMiddlewares } from '#api/auth/routes.js';
import { DB } from '#api/odm/index.js';

extendSupertest();

const iosocket = { emit: jest.fn() };

enum TestEmitSources {
  session = 'session',
  currentTenant = 'currentTenant',
}

// setUpApp is routinely called at module scope, before testingEnvironment.setUp() has
// connected to the DB, and some specs never connect at all (they don't need one).
// authenticatedUserMiddlewares() needs a live connection to build its Mongo session store,
// so defer building it to the first actual request, self-connecting with the bare DB.connect()
// if the worker is not connected (including a leftover handle after a previous spec
// disconnected). Deliberately not testingDB.connect(): that helper also mocks the current
// tenant as a side effect, which would clobber tenant mocks specs set up themselves
// (e.g. testingEnvironment.setTenant() with a specific `domain`) for specs that never otherwise
// need a real DB connection.
const lazyAuthenticatedUserMiddlewares = () => {
  let middlewares: ((req: Request, res: Response, next: NextFunction) => void)[] | undefined;
  let connecting: Promise<unknown> | undefined;

  return (req: Request, res: Response, next: NextFunction) => {
    (async () => {
      if (!middlewares) {
        const existingConnection = DB.getConnection();
        if (!existingConnection || existingConnection.readyState !== 1) {
          connecting ??= DB.connect();
          await connecting;
        }
        middlewares = authenticatedUserMiddlewares();
      }
    })()
      .then(() => {
        const runFrom = (index: number, error?: unknown): void => {
          if (error) {
            next(error);
            return;
          }
          const middleware = middlewares![index];
          if (!middleware) {
            next();
            return;
          }
          middleware(req, res, (err?: unknown) => runFrom(index + 1, err));
        };

        runFrom(0);
      })
      .catch(next);
  };
};

const setUpApp = (
  route: Function,
  ...customMiddleware: ((req: Request, _es: Response, next: NextFunction) => void)[]
): Application => {
  jest
    .spyOn(setupSockets, 'emitToTenant')
    .mockImplementation((_tenant: string, event: string, ...args: any[]) => {
      iosocket.emit(event, TestEmitSources.currentTenant, ...args);
    });
  jest
    .spyOn(setupSockets, 'emitToSession')
    .mockImplementation((_sessionId: string, event: string, ...args: any[]) => {
      iosocket.emit(event, TestEmitSources.session, ...args);
    });
  const app: Application = express();
  routesErrorHandler(app);
  app.use(requestTimingMiddleware);
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
  app.use(lazyAuthenticatedUserMiddlewares());
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
