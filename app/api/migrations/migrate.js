import connect, { disconnect } from 'api/utils/connect_to_mongo.js';
import errorLog from 'api/log/errorLog';
import migrator from './migrator';

connect()
  .then(() => migrator.migrate())
  .then(() => {
    errorLog.closeGraylog();
    disconnect();
  });
