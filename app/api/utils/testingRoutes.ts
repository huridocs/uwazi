import bodyParser from 'body-parser';
import express, { Application, NextFunction, Request, RequestHandler, Response } from 'express';
import * as OpenApiValidator from 'express-openapi-validator';
import { Response as SuperTestResponse } from 'supertest';

import { config } from 'api/config';
import errorHandlingMiddleware from 'api/utils/error_handling_middleware';
import languageMiddleware from 'api/utils/languageMiddleware';
import { routesErrorHandler } from 'api/utils/routesErrorHandler';
import { extendSupertest } from './supertestExtensions';
import { swaggerDocument } from '../../swagger';

extendSupertest();

const iosocket = { emit: jest.fn() };

const setUpApp = (
  route: Function,
  ...customMiddleware: ((req: Request, _es: Response, next: NextFunction) => void)[]
): Application => {
  const app: Application = express();
  routesErrorHandler(app);
  app.use(bodyParser.json() as RequestHandler);
  app.use((req: Request, _res: Response, next: NextFunction) => {
    req.emitToSessionSocket = (event: string, ...args: any[]) => iosocket.emit(event, ...args);
    req.sockets = {
      emitToCurrentTenant: (event: string, ...args: any[]) => iosocket.emit(event, ...args),
    };
    next();
  });

  app.use(
    OpenApiValidator.middleware({
      apiSpec: swaggerDocument,
      validateApiSpec: false,
      ignoreUndocumented: true,
      validateRequests: {
        coerceTypes: 'array',
      },
    })
  );

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

export { setUpApp, socketEmit, iosocket };
