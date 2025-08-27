/* eslint-disable no-console */

import bodyParser from 'body-parser';
import compression from 'compression';
import express from 'express';
import promBundle from 'express-prom-bundle';

import helmet from 'helmet';
import { Server } from 'http';
import mongoose from 'mongoose';
import path from 'path';

import * as Sentry from '@sentry/node';

import { registerEventListeners } from 'api/eventListeners';
import { applicationEventsBus } from 'api/eventsbus';
import { appContextMiddleware } from 'api/utils/appContextMiddleware';
import { requestIdMiddleware } from 'api/utils/requestIdMiddleware';
import { Redis } from 'api/infrastructure/Redis';
import { maskMongoPassword } from 'api/utils/maskMongoPassword';
import uwaziMessage from '../message';
import apiRoutes from './api/api';
import privateInstanceMiddleware from './api/auth/privateInstanceMiddleware';
import authRoutes from './api/auth/routes';
import { config } from './api/config';

import { versionRoutes } from './api/version/routes';
import { migrator } from './api/migrations/migrator';
import { DB } from './api/odm';
import { permissionsContext } from './api/permissions/permissionsContext';
import { closeSockets } from './api/socketio/setupSockets';
import { tenants } from './api/tenants/tenantContext';
import errorHandlingMiddleware from './api/utils/error_handling_middleware';
import { handleError } from './api/utils/handleError.js';
import { multitenantMiddleware } from './api/utils/multitenantMiddleware';
import { routesErrorHandler } from './api/utils/routesErrorHandler';
import { serverSideRender } from './react/server';
import { initSentry } from './initSentry';
import { setupQueueWorker } from './setupQueueWorker';

mongoose.Promise = Promise;

const app = express();
const metricsMiddleware = promBundle({
  includeMethod: false,
  includePath: false,
  customLabels: {
    port: config.PORT,
    env: config.ENVIRONMENT,
  },
  promClient: {
    collectDefaultMetrics: {},
  },
});

app.use(metricsMiddleware);
initSentry();
routesErrorHandler(app);
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));

const http = Server(app);

const gracefullShutdown = () => {
  process.stdout.write('SIGINT signal received.\r\n');
  http.close(error => {
    process.stdout.write('Gracefully closing express connections\r\n');
    if (error) {
      process.stderr.write(error.toString());
      process.exit(1);
    }

    Redis.disconnect()
      .then(() => {
        process.stdout.write('Disconnected from Redis\r\n');
        return DB.disconnect();
      })
      .then(() => {
        process.stdout.write('Disconnected from database\r\n');
        process.stdout.write('Server closed succesfully\r\n');
        process.exit(0);
      });
  });
  closeSockets();
};

const uncaughtError = error => {
  handleError(error, { uncaught: true });
  Sentry.close(2000).then(() => {
    gracefullShutdown();
  });
};

process.on('unhandledRejection', uncaughtError);
process.on('uncaughtException', uncaughtError);

const oneYear = 31557600;

let maxage = 0;
if (app.get('env') === 'production') {
  maxage = oneYear;
}

app.use(compression());
app.use(express.static(path.resolve(__dirname, '../dist'), { maxage }));
app.use('/public', express.static(config.publicAssets));
app.use(/\/((?!remotepublic).)*/, bodyParser.json({ limit: '5mb' }));

app.use(appContextMiddleware);

// this middleware should go just before any other that accesses to db
app.use(multitenantMiddleware);
app.use(requestIdMiddleware);

console.info('==> Connecting to', maskMongoPassword(config.DBHOST));
DB.connect(config.DBHOST, config.DBAUTH).then(async () => {
  await Redis.connect();
  await tenants.setupTenants();
  authRoutes(app);
  versionRoutes(app);
  app.use(privateInstanceMiddleware);
  app.use('/flag-images', express.static(path.resolve(__dirname, '../dist/flags')));

  apiRoutes(app, http);
  serverSideRender(app);

  app.use(errorHandlingMiddleware);
  registerEventListeners(applicationEventsBus);

  if (config.externalServices) {
    // eslint-disable-next-line global-require
    require('./worker');
  }

  if (!config.multiTenant && !config.clusterMode) {
    await tenants.run(async () => {
      const shouldMigrate = await migrator.shouldMigrate();
      if (shouldMigrate) {
        console.error(
          '\x1b[33m%s\x1b[0m',
          '==> Your database needs to be migrated, please run:\n\n yarn migrate & yarn reindex\n\n'
        );
        process.exit(1);
      }
    });
    // eslint-disable-next-line global-require
    setupQueueWorker({ standAloneProcess: false });
  }

  const bindAddress = { true: 'localhost' }[process.env.LOCALHOST_ONLY];
  const port = config.PORT;

  http.listen(port, bindAddress, async () => {
    await tenants.run(async () => {
      permissionsContext.setCommandContext();
    });

    console.info(
      '==> 🌎 Listening on port %s. Open up http://localhost:%s/ in your browser.',
      port,
      port
    );

    if (process.env.HOT) {
      console.info('');
      console.info('==> 📦 webpack is watching...');
      console.info(uwaziMessage);
    }
  });

  process.on('SIGINT', gracefullShutdown);
});
