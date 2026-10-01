import { ChangeStream, type Db, type MongoError } from 'mongodb';
import type { TenantsChangeFeed } from '../application/contracts/TenantsChangeFeed.js';

const COLLECTION = 'tenants';

const schemaValidator = {
  $jsonSchema: {
    bsonType: 'object',
    properties: {
      name: {
        bsonType: 'string',
        description: 'must be a string and is required',
        minLength: 1,
      },
    },
  },
};

class MongoTenantsChangeFeed implements TenantsChangeFeed {
  private stream?: ChangeStream;

  constructor(private readonly db: () => Db) {}

  /**
   * Resolves once the server has opened the stream (its first resume token arrives): `watch()` opens
   * it lazily, so a change written before then would never be reported. A stream error also
   * resolves, after being handled.
   */
  async start(onChange: () => void, onError: (error: Error) => void): Promise<void> {
    await this.ensureCollection();

    const stream = this.db().collection(COLLECTION).watch();
    this.stream = stream;
    await new Promise<void>(resolve => {
      stream.once(ChangeStream.RESUME_TOKEN_CHANGED, () => resolve());
      stream.on('change', onChange);
      stream.on('error', (error: MongoError) => {
        resolve();
        //The $changeStream stage is only supported on replica sets
        if (error.code === 40573) {
          // mongo documentation and ts types says changeStream.close returns a promise
          // but actually it does not in the current version,
          // catching the promise results in a "catch of undefined" error
          void stream.close();
        } else {
          onError(error);
        }
      });
    });
  }

  async stop(): Promise<void> {
    await this.stream?.close();
  }

  private async ensureCollection(): Promise<void> {
    const db = this.db();
    const collections = (await db.listCollections().toArray()).map(c => c.name);

    if (collections.includes(COLLECTION)) {
      await db.command({ collMod: COLLECTION, validator: schemaValidator });
    } else {
      await db.createCollection(COLLECTION, { validator: schemaValidator });
    }

    await db.collection(COLLECTION).createIndex({ name: 1 }, { unique: true });
  }
}

export { MongoTenantsChangeFeed };
