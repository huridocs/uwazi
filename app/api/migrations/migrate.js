import connect, { disconnect } from './connect_to_mongo.js';
import migrator from './migrator';

connect()
.then(() => migrator.migrate())
.then(disconnect);
