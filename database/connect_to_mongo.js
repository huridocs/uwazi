import dbConfig from '../app/api/config/database.js';
import indexConfig from '../app/api/config/elasticIndexes.js';
import mongoose from 'mongoose';
mongoose.Promise = Promise;

const index = 'development';
indexConfig.index = indexConfig[index];

export default () => {
  return new Promise((resolve, reject) => {
    mongoose.connect(dbConfig[index], {useMongoClient: true});
    const db = mongoose.connection;
    db.on('error', reject);
    db.once('open', function () {
      resolve();
    });
  });
};
