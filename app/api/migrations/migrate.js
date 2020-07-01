import connect, { disconnect } from 'api/utils/connect_to_mongo.js';
import errorLog from 'api/log/errorLog';
import migrator from './migrator';

process.on('unhandledRejection', error => {
  throw error;
});

connect()
  .then(() => migrator.migrate())
  .then(() => {
    errorLog.closeGraylog();
    disconnect();
  });
