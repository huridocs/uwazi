/* eslint-disable max-classes-per-file */
import { Db } from 'mongodb';

import { MongoIdHandler } from 'api/common.v2/database/MongoIdGenerator';
import { MongoResultSet } from 'api/common.v2/database/MongoResultSet';
import { MongoDataSource } from '../../common.v2/database/MongoDataSource';
import { HubDataSource, HubType } from '../contracts/HubDataSource';

const collectionExists = async (db: Db, name: string) => {
  const collections = await db.listCollections({ name }).toArray();
  return collections.length > 0;
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
    if (await this.exists()) {
      await this.db.dropCollection(this.collectionName, { session: this.getSession() });
    }
    if (!this.created) {
      await this.db.createCollection(this.collectionName, { session: this.getSession() });
      this.created = true;
    }
  }

  async exists(): Promise<boolean> {
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
    const toInsert = ids.filter(id => !existingIds.has(id));
    if (toInsert.length > 0) {
      await collection.insertMany(
        toInsert.map(id => ({ _id: MongoIdHandler.mapToDb(id) })),
        { session: this.getSession() }
      );
    }
  }

  all(): MongoResultSet<HubType, string> {
    this.shouldBeReady();
    const cursor = this.getCollection().find({}, { session: this.getSession() });
    return new MongoResultSet<HubType, string>(cursor, dbo => dbo._id.toString());
  }
}
