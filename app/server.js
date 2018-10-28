/* eslint-disable no-console */
import bodyParser from 'body-parser';
import compression from 'compression';
import express from 'express';
import helmet from 'helmet';
import mongoose from 'mongoose';

import { Server } from 'http';
import path from 'path';

import { uploadDocumentsPath } from './api/config/paths';
import apiRoutes from './api/api';
import authRoutes from './api/auth/routes';
import dbConfig from './api/config/database';
import errorHandlingMiddleware from './api/utils/error_handling_middleware';
import handleError from './api/utils/handleError.js';
import ports from './api/config/ports.js';
import privateInstanceMiddleware from './api/auth/privateInstanceMiddleware';
import serverRenderingRoutes from './react/server.js';
import systemKeys from './api/i18n/systemKeys.js';
import translations from './api/i18n/translations.js';
import uwaziMessage from '../message';

mongoose.Promise = Promise;

const app = express();
app.use(helmet());

const http = Server(app);

const uncaughtError = (error) => {
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
app.use('/public', express.static(path.resolve(__dirname, '../public')));

app.use(bodyParser.json());

authRoutes(app);

app.use(privateInstanceMiddleware);
app.use('/flag-images', express.static(path.resolve(__dirname, '../dist/flags')));
app.use('/uploaded_documents', express.static(uploadDocumentsPath));

apiRoutes(app, http);
serverRenderingRoutes(app);

app.use(errorHandlingMiddleware);

mongoose.connect(dbConfig[app.get('env')], { useMongoClient: true })
.then(async () => {
  console.info('==> Processing system keys...');
  await translations.processSystemKeys(systemKeys);

  const port = ports[app.get('env')];

  const bindAddress = ({ true: 'localhost' })[process.env.LOCALHOST_ONLY];

  http.listen(port, bindAddress, () => {
    console.info('==> 🌎 Listening on port %s. Open up http://localhost:%s/ in your browser.', port, port);
    if (process.env.HOT) {
      console.info('');
      console.info('webpack is watching...');
      console.info(uwaziMessage);
    }
  });
});
