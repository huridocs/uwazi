import connect, { disconnect } from 'api/utils/connect_to_mongo.js';
import migrator from './migrator';

connect()
  .then(() => migrator.migrate())
  .then(disconnect);
