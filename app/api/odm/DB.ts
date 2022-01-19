import mongoose, { Connection, ConnectionOptions } from 'mongoose';
import { config } from 'api/config';
import { SessionOptions } from 'mongodb';

let connection: Connection;

// setting this on createConnection directly is not working, maybe mongoose bug?
mongoose.set('useCreateIndex', true);

const DB = {
  async connect(uri: string = config.DBHOST, auth?: ConnectionOptions) {
    connection = await mongoose.createConnection(uri, {
      ...auth,
      useUnifiedTopology: true,
      useNewUrlParser: true,
    });

    connection.replica = true;
    return this.getConnection();
  },

  async disconnect() {
    return mongoose.disconnect();
  },

  connectionForDB(dbName: string) {
    return this.getConnection().useDb(dbName, { useCache: true });
  },

  getConnection() {
    return connection;
  },

  async getSession(options?: SessionOptions) {
    return this.getConnection().startSession(options);
  },
};

export { DB };
