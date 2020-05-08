/* eslint-disable no-console */

import bodyParser from 'body-parser';
import compression from 'compression';
import express from 'express';
import helmet from 'helmet';
import { Server } from 'http';
import mongoose from 'mongoose';
import path from 'path';

import { TaskProvider } from 'shared/tasks/tasks';

import uwaziMessage from '../message';
import apiRoutes from './api/api';
import privateInstanceMiddleware from './api/auth/privateInstanceMiddleware';
import authRoutes from './api/auth/routes';
import { config } from './api/config';
import paths from './api/config/paths';
import vaultSync from './api/evidences_vault';
import systemKeys from './api/i18n/systemKeys.js';
import translations from './api/i18n/translations.js';
import migrator from './api/migrations/migrator';
import { workerManager as semanticSearchManager } from './api/semanticsearch';
import settings from './api/settings';
import syncWorker from './api/sync/syncWorker';
import errorHandlingMiddleware from './api/utils/error_handling_middleware';
import handleError from './api/utils/handleError.js';
import repeater from './api/utils/Repeater';
import serverRenderingRoutes from './react/server.js';
import { DB } from './api/odm';
// import { tenants } from './api/odm/tenantContext';
import { multitenantMiddleware } from './api/utils/multitenantMiddleware';

mongoose.Promise = Promise;

const app = express();
app.use(helmet());

const http = Server(app);

const uncaughtError = error => {
  handleError(error, { uncaught: true });
  process.exit(1);
};

process.on('unhandledRejection', uncaughtError);
process.on('uncaughtException', uncaughtError);
http.on('error', handleError);

const oneYear = 31557600;

let maxage = 0;
if (app.get('env') === 'production') {
  maxage = oneYear;
}

app.use(compression());
app.use(express.static(path.resolve(__dirname, '../dist'), { maxage }));
app.use('/public', express.static(paths.publicAssets));
app.use(/\/((?!remotepublic).)*/, bodyParser.json({ limit: '1mb' }));

//////
// this middleware should go just before any other that accesses to db
app.use(multitenantMiddleware);
//////

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
  authRoutes(app);
  app.use(privateInstanceMiddleware);
  app.use('/flag-images', express.static(path.resolve(__dirname, '../dist/flags')));
  app.use('/assets', express.static(paths.customUploads));
  // retained for backwards compatibility
  app.use('/uploaded_documents', express.static(paths.customUploads));
  apiRoutes(app, http);
  serverRenderingRoutes(app);
  app.use(errorHandlingMiddleware);
  // just for testing, manually added tenants, this needs to be added via some other process
  //
  // tenants.add({ name: 'uwazi_development' });
  // tenants.add({ name: 'tenant2', dbName: 'tenant2', indexName: 'tenant2' });
  //

  if (!process.env.MULTI_TENANT_ACTIVE) {
    console.info('==> Processing system keys...');
    await translations.processSystemKeys(systemKeys);
    const shouldMigrate = await migrator.shouldMigrate();
    if (shouldMigrate) {
      console.info('\x1b[33m%s\x1b[0m', '==> Your database needs to be migrated, please wait.');
      await migrator.migrate();
    }

    semanticSearchManager.start();
  }

  const bindAddress = { true: 'localhost' }[process.env.LOCALHOST_ONLY];
  const port = config.PORT;
  http.listen(port, bindAddress, async () => {
    if (!process.env.MULTI_TENANT_ACTIVE) {
      syncWorker.start();

      const { evidencesVault } = await settings.get();
      if (evidencesVault && evidencesVault.token && evidencesVault.template) {
        console.info('==> 📥 evidences vault config detected, started sync ....');
        repeater.start(() => vaultSync.sync(evidencesVault.token, evidencesVault.template), 10000);
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
