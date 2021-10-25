/* eslint-disable no-console */

import bodyParser from 'body-parser';
import compression from 'compression';
import express from 'express';

import helmet from 'helmet';
import { Server } from 'http';
import mongoose from 'mongoose';
import path from 'path';

import { TaskProvider } from 'shared/tasks/tasks';

import { appContextMiddleware } from 'api/utils/appContextMiddleware';
import { requestIdMiddleware } from 'api/utils/requestIdMiddleware';
import uwaziMessage from '../message';
import apiRoutes from './api/api';
import privateInstanceMiddleware from './api/auth/privateInstanceMiddleware';
import authRoutes from './api/auth/routes';
import { config } from './api/config';
import vaultSync from './api/evidences_vault';

import { migrator } from './api/migrations/migrator';
import settings from './api/settings';
import syncWorker from './api/sync/syncWorker';
import errorHandlingMiddleware from './api/utils/error_handling_middleware';
import { handleError } from './api/utils';
import repeater from './api/utils/Repeater';
import serverRenderingRoutes from './react/server.js';
import { DB } from './api/odm';
import { tenants } from './api/tenants/tenantContext';
import { multitenantMiddleware } from './api/utils/multitenantMiddleware';
import { staticFilesMiddleware } from './api/utils/staticFilesMiddleware';
import { customUploadsPath, uploadsPath } from './api/files/filesystem';
import { tocService } from './api/toc_generation/tocService';
import { permissionsContext } from './api/permissions/permissionsContext';
import { routesErrorHandler } from './api/utils/routesErrorHandler';

mongoose.Promise = Promise;

const app = express();
routesErrorHandler(app);
app.use(helmet());

const http = Server(app);

const uncaughtError = error => {
  handleError(error, { uncaught: true });
  throw error;
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
app.use(/\/((?!remotepublic).)*/, bodyParser.json({ limit: '1mb' }));

app.use(appContextMiddleware);

//////
// this middleware should go just before any other that accesses to db
app.use(multitenantMiddleware);
//////
app.use(requestIdMiddleware);
let dbAuth = {};

if (process.env.DBUSER) {
  dbAuth = {
    auth: { authSource: 'admin' },
    user: process.env.DBUSER,
    pass: process.env.DBPASS,
  };
}

console.info('==> Connecting to', config.DBHOST);
DB.connect(config.DBHOST, dbAuth).then(async () => {
  await tenants.setupTenants();
  authRoutes(app);
  app.use(privateInstanceMiddleware);
  app.use('/flag-images', express.static(path.resolve(__dirname, '../dist/flags')));
  app.use('/assets/:fileName', staticFilesMiddleware([customUploadsPath]));
  app.use(
    '/uploaded_documents/:fileName',
    staticFilesMiddleware([
      uploadsPath,
      // retained for backwards compatibility
      customUploadsPath,
      //
    ])
  );
  apiRoutes(app, http);
  serverRenderingRoutes(app);
  app.use(errorHandlingMiddleware);

  if (!config.multiTenant && !config.clusterMode) {
    await tenants.run(async () => {
      const shouldMigrate = await migrator.shouldMigrate();
      if (shouldMigrate) {
        console.error(
          '\x1b[33m%s\x1b[0m',
          '==> Your database needs to be migrated, please run:\n\n yarn migrate & yarn reindex\n\n'
        );
        process.exit();
      }
    });
  }

  const bindAddress = { true: 'localhost' }[process.env.LOCALHOST_ONLY];
  const port = config.PORT;

  http.listen(port, bindAddress, async () => {
    await tenants.run(async () => {
      permissionsContext.setCommandContext();
      if (!config.multiTenant && !config.clusterMode) {
        syncWorker.start();

        const { evidencesVault, features } = await settings.get();
        if (evidencesVault && evidencesVault.token && evidencesVault.template) {
          console.info('==> 📥  evidences vault config detected, started sync ....');
          repeater.start(
            () => vaultSync.sync(evidencesVault.token, evidencesVault.template),
            10000
          );
        }

        if (features && features.tocGeneration && features.tocGeneration.url) {
          console.info('==> 🗂️ automatically generating TOCs using external service');
          const service = tocService(features.tocGeneration.url);
          repeater.start(() => service.processNext(), 10000);
        }

        repeater.start(
          () =>
            TaskProvider.runAndWait('TopicClassificationSync', 'TopicClassificationSync', {
              mode: 'onlynew',
              noDryRun: true,
              overwrite: true,
            }),
          10000
        );
      }
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
});
