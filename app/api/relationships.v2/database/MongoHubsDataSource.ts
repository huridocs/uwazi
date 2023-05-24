/* eslint-disable max-classes-per-file */
import { Db, ObjectId } from 'mongodb';

import { MongoIdHandler } from 'api/common.v2/database/MongoIdGenerator';
import { MongoDataSource } from '../../common.v2/database/MongoDataSource';
import { HubDataSource } from '../contracts/HubDataSource';

const collectionExists = async (db: Db, name: string) => {
  const collections = await db.listCollections({ name }).toArray();
  return collections.length > 0;
};

type HubType = {
  _id: ObjectId;
};

class TemporaryDataSourceError extends Error {}

export class MongoHubsDataSource extends MongoDataSource<HubType> implements HubDataSource {
  protected collectionName = 'temporary_hubs';

  protected created = false;

  protected dropped = false;

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

  shouldBeReady() {
    this.shouldBeCreated();
    this.shouldNotBeDropped();
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
    this.shouldBeReady();
    if (await this.exists()) {
      await this.db.dropCollection(this.collectionName, { session: this.getSession() });
      this.dropped = true;
    }
  }

  async insertIds(ids: string[]): Promise<void> {
    this.shouldBeReady();
    const collection = this.getCollection();
    const existing = await collection
      .find({ _id: { $in: ids.map(id => MongoIdHandler.mapToDb(id)) } })
      .toArray();
    const existingIds = new Set(existing.map(d => d._id.toString()));
    const toInsert = ids.filter(id => !existingIds.has(id.toString()));
    if (toInsert.length > 0) {
      await collection.insertMany(
        ids.map(id => ({ _id: MongoIdHandler.mapToDb(id) })),
        { session: this.getSession() }
      );
    }
  }
}
