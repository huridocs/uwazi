/* eslint-disable max-classes-per-file */
import { Db, Document } from 'mongodb';

import { MongoDataSource } from './MongoDataSource';
import { MongoTransactionManager } from './MongoTransactionManager';
import { TemporaryDataSource } from '../contracts/TemporaryDataSource';

const TEMP_COLLECTION_MARKER = '__temp_';

const getRandomSuffix = () => Math.random().toString(36).substring(2, 8);

const getName = (name: string) => `${TEMP_COLLECTION_MARKER}${name}_${getRandomSuffix()}`;

const collectionExists = async (db: Db, name: string) => {
  const collections = await db.listCollections({ name }).toArray();
  return collections.length > 0;
};

class TemporaryDataSourceError extends Error {}

export class MongoTemporaryDataSource<DbSchema extends Document>
  extends MongoDataSource<DbSchema>
  implements TemporaryDataSource<DbSchema>
{ //eslint-disable-line
  protected collectionName = '';

  protected created = false;

  protected dropped = false;

  constructor(name: string, db: Db, transactionManager: MongoTransactionManager) {
    super(db, transactionManager);
    this.collectionName = getName(name);
  }

  name() {
    return this.collectionName;
  }

  shouldBeCreated() {
    if (!this.created) {
      throw new TemporaryDataSourceError(`Collection ${this.collectionName} was not created`);
    }
  }

  shouldNotBeDropped() {
    if (this.dropped) {
      throw new TemporaryDataSourceError(`Collection ${this.collectionName} was already dropped`);
    }
  }

  async create(): Promise<void> {
    this.shouldNotBeDropped();
    if (!this.created) {
      await this.db.createCollection(this.collectionName, { session: this.getSession() });
      this.created = true;
    }
  }

  async exists(): Promise<boolean> {
    this.shouldBeCreated();
    return collectionExists(this.db, this.collectionName);
  }

  async drop(): Promise<void> {
    this.shouldBeCreated();
    this.shouldNotBeDropped();
    if (await this.exists()) {
      await this.db.dropCollection(this.collectionName, { session: this.getSession() });
      this.dropped = true;
    }
  }
}
