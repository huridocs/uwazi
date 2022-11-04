import { MongoClient } from "mongodb";

const getClientAndDB = async () => {
    const url = process.env.DBHOST ? `mongodb://${process.env.DBHOST}/` : 'mongodb://localhost/';
    const client = new MongoClient(url);
    await client.connect();
  
    const db = client.db(process.env.DATABASE_NAME || 'uwazi_development');
  
    return {client, db};
  };

export { getClientAndDB };