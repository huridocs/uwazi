import mongoose from 'mongoose';

import dbConfig from 'api/config/database.js';
import indexConfig from 'api/config/elasticIndexes.js';

mongoose.Promise = Promise;

const index = 'development';
indexConfig.index = indexConfig[index];

export default () =>
  new Promise((resolve, reject) => {
    mongoose.connect(dbConfig[index]);
    const db = mongoose.connection;
    db.on('error', reject);
    db.once('open', () => {
      resolve();
    });
  });

const disconnect = () => mongoose.disconnect();

export { disconnect };
