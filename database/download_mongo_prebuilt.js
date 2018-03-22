const MongodbMemoryServer = require('mongodb-memory-server').default;
const mongod = new MongodbMemoryServer();
mongod.getConnectionString()
.then(() => {
  process.exit()
});
