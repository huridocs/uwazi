import mongoose, { Connection, ConnectionOptions } from 'mongoose';
import { config } from 'api/config';

let connection: Connection;

// setting this on createConnection directly is not working, maybe mongoose bug?
mongoose.set('useCreateIndex', true);

const DB = {
  async connect(uri: string = config.DBHOST, auth: ConnectionOptions = {}) {
    connection = await mongoose.createConnection(uri, {
      ...auth,
      useUnifiedTopology: true,
      useNewUrlParser: true,
      poolSize: config.mongo_connection_pool_size,
    });

    return this.getConnection();
  },

  async disconnect() {
    return mongoose.disconnect();
  },

  connectionForDB(dbName: string, options = { useCache: true, noListener: true }) {
    return this.getConnection().useDb(dbName, options);
  },

  getConnection() {
    return connection;
  },
};

export { DB };
