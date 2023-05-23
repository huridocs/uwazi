import { Collection, Db, MongoClient, MongoError, OptionalId } from "mongodb";

import { BulkWriteStream } from "../../../app/api/common.v2/database/BulkWriteStream";
import { print } from './log';

const batchsize = 1000;

const getClientAndDB = async (databaseName?: string) => {
    const url = process.env.DBHOST ? `mongodb://${process.env.DBHOST}/` : 'mongodb://localhost/';
    const client = new MongoClient(url);
    await client.connect();
  
    const db = client.db(databaseName || process.env.DATABASE_NAME || 'uwazi_development');
  
    return {client, db};
};

const createTempCollection = async (db: Db, name: string) => {
  try {
    await db.createCollection(name);
  } catch (error) {
    if (!(error instanceof MongoError)) throw error;
    if (!error.message.endsWith('already exists')) throw error;
    await db.dropCollection(name);
    await db.createCollection(name);
  }
};

const createTempCollections = async (db: Db, names: string[]) => {
  print('Creating temporary collections...\n');
  await Promise.all(names.map(name => createTempCollection(db, name)))
  print('Temporary collections created.\n');
};

const copyCollection = async <T extends { [key: string]: any; }>(db: Db, source: Collection<T>, target: Collection<T>) => {
  const sourceCursor = source.find({});
  const targetWriter = new BulkWriteStream(target, undefined, batchsize);
  while (await sourceCursor.hasNext()) {
    const next = await sourceCursor.next() as OptionalId<T>;
    if (next) await targetWriter.insert(next);
  }
  await targetWriter.flush();
};

const finalize = async(db: Db, sourceTargetPairs: [Collection<any>, Collection<any>][], toDrop: Collection<any>[]) => {
  if(sourceTargetPairs.length){
    print('Copy from temp to final...\n');
    for(let i = 0; i < sourceTargetPairs.length; i+=1) {
      const [source, target] = sourceTargetPairs[i];
      await copyCollection(db, source, target);
    }
    print('Copy from temp to final done.\n');
  }  
  
  if(toDrop.length) {
    print('Dropping temp collections...\n');
    for( let i =0; i < toDrop.length; i+=1 ) {
      const coll = toDrop[i];
      await coll.drop();
    }
    print('Temp collections dropped.\n');
  }
};

export { createTempCollections, getClientAndDB, finalize };