/* eslint-disable max-statements */
/* eslint-disable no-console */

import './initSentryEarly.js';
import compression from 'compression';
import express from 'express';

import helmet from 'helmet';
import { Server } from 'http';
import mongoose from 'mongoose';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

import { close } from '@sentry/node-core/light';

import { registerEventListeners } from '#api/eventListeners.js';
import { applicationEventsBus } from '#api/core/libs/eventsbus/index.js';
import { appContextMiddleware } from '#api/utils/appContextMiddleware.js';
import { Redis } from '#api/infrastructure/Redis.js';
import { maskMongoPassword } from '#api/utils/maskMongoPassword.js';
import { elasticClient } from '#api/search/elastic.js';
import uwaziMessage from '../message.js';
import apiRoutes from './api/api.js';
import privateInstanceMiddleware from './api/auth/privateInstanceMiddleware.js';
import authRoutes from './api/auth/routes.js';
import { config } from './api/config.js';

import { versionRoutes } from './api/version/routes.js';
import { migrator } from './api/migrations/migrator.js';
import { DB } from './api/odm/index.js';
import { permissionsContext } from './api/permissions/permissionsContext.js';
import { closeSockets } from './api/socketio/setupSockets.js';
import { tenants } from './api/tenants/tenantContext.js';
import errorHandlingMiddleware from './api/utils/error_handling_middleware.js';
import { handleError } from './api/utils/handleError.js';
import { maintenanceMiddleware } from './api/utils/maintenanceMiddleware.js';
import { multitenantMiddleware } from './api/utils/multitenantMiddleware.js';
import { routesErrorHandler } from './api/utils/routesErrorHandler.js';
import { serverSideRender } from './react/server.js';
import { setupQueueWorker } from './setupQueueWorker.js';
import { dependenciesContextMiddleware } from '#api/core/infrastructure/express/middlewares/DependenciesMiddleware.js';
import { embedFrameHeaders } from './api/middleware/embedFrameHeaders.js';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import { PgMigrator } from '#api/core/infrastructure/postgresql/PgMigrator.js';
import { registerMetricsRoutes } from '#api/core/infrastructure/express/MetricsRoute.js';
import { metricsMiddleware } from '#api/core/infrastructure/express/middlewares/MetricsMiddleware.js';
import { telemetryMiddleware } from '#api/core/infrastructure/express/middlewares/TelemetryMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

mongoose.Promise = Promise;

const app = express();

registerMetricsRoutes(app);
routesErrorHandler(app);
app.use(telemetryMiddleware);
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(embedFrameHeaders);

const http = Server(app);

const gracefullShutdown = () => {
  process.stdout.write('SIGINT signal received.\r\n');
  http.close(async error => {
    process.stdout.write('Gracefully closing express connections\r\n');
    if (error) {
      process.stderr.write(error.toString());
      process.exit(1);
    }

    const tasks = [
      (async () => {
        try {
          await Redis.disconnect();
          process.stdout.write('Disconnected from Redis\r\n');
        } catch (e) {
          // ignore
        }
      })(),
      (async () => {
        try {
          await DB.disconnect();
          await PostgresDB.disconnect();
          process.stdout.write('Disconnected from database\r\n');
        } catch (e) {
          // ignore
        }
      })(),
      (async () => {
        try {
          await elasticClient.close();
          process.stdout.write('Disconnected from Elasticsearch\r\n');
        } catch (e) {
          // ignore
        }
      })(),
    ];

    await Promise.allSettled(tasks);
    process.stdout.write('Server closed succesfully\r\n');
    process.exit(0);
  });
  closeSockets();
};

const uncaughtError = error => {
  handleError(error, { uncaught: true });
  close(2000).then(() => {
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

app.use(appContextMiddleware);

// this middleware should go just before any other that accesses to db
app.use(multitenantMiddleware);
app.use(maintenanceMiddleware);
app.use(metricsMiddleware);

console.info('==> Connecting to', maskMongoPassword(config.DBHOST));

DB.connect(config.DBHOST, config.DBAUTH).then(async () => {
  await Redis.connect();
  await tenants.setupTenants();
  authRoutes(app);
  app.use(dependenciesContextMiddleware);
  versionRoutes(app);
  app.use(privateInstanceMiddleware);
  app.use('/flag-images', express.static(path.resolve(__dirname, '../dist/flags')));

  await apiRoutes(app, http);
  serverSideRender(app);

  app.use(errorHandlingMiddleware);
  registerEventListeners(applicationEventsBus);

  if (config.externalServices) {
    await import('./worker.js');
  }

  if (!config.multiTenant && !config.clusterMode) {
    await tenants.run(async () => {
      const skipMigrationCheck = process.env.SKIP_MIGRATION_CHECK === 'true';
      const shouldMigrate = skipMigrationCheck ? false : await migrator.shouldMigrate();
      if (shouldMigrate) {
        console.error(
          '\x1b[33m%s\x1b[0m',
          '==> Your database needs to be migrated, please run:\n\n yarn migrate & yarn reindex\n\n'
        );
        process.exit(1);
      }

      if (!skipMigrationCheck) {
        const pgMigrationsDir = path.resolve(
          __dirname,
          'api/core/infrastructure/postgresql/schema_migrations'
        );
        const pgMigrator = new PgMigrator(pgMigrationsDir, PostgresDB.adminPool());
        const { pending: pendingPgMigrations } = await pgMigrator.status();
        if (pendingPgMigrations.length > 0) {
          console.error(
            '\x1b[33m%s\x1b[0m',
            '==> PostgreSQL needs to be migrated, please run:\n\n yarn migrate --new\n\n'
          );
          process.exit(1);
        }
      }
    });

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
  process.on('SIGTERM', gracefullShutdown);
});
