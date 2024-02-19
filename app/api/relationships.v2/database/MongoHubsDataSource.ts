/* eslint-disable max-classes-per-file */
import { MongoIdHandler } from 'api/common.v2/database/MongoIdGenerator';
import { MongoResultSet } from 'api/common.v2/database/MongoResultSet';
import { MongoDataSource } from '../../common.v2/database/MongoDataSource';
import { HubDataSource, HubType } from '../contracts/HubDataSource';

class TemporaryDataSourceError extends Error {}

export class MongoHubsDataSource extends MongoDataSource<HubType> implements HubDataSource {
  protected collectionName = 'temporary_hubs';

  protected created = false;

  protected dropped = false;

  private shouldBeCreated() {
    if (!this.created) {
      throw new TemporaryDataSourceError(`Collection ${this.collectionName} was not created`);
    }
  }

  private shouldNotBeDropped() {
    if (this.dropped) {
      throw new TemporaryDataSourceError(`Collection ${this.collectionName} was already dropped`);
    }
  }

  private shouldBeReady() {
    this.shouldBeCreated();
    this.shouldNotBeDropped();
  }

  async create(): Promise<void> {
    this.shouldNotBeDropped();
    if (await this.collectionExists()) {
      await this.dropCollection();
    }
    if (!this.created) {
      await this.createCollection();
      this.created = true;
    }
  }

  async drop(): Promise<void> {
    this.shouldBeReady();
    if (await this.collectionExists()) {
      await this.dropCollection();
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
      await collection.insertMany(toInsert.map(id => ({ _id: MongoIdHandler.mapToDb(id) })));
    }
  }

  all(): MongoResultSet<HubType, string> {
    this.shouldBeReady();
    const cursor = this.getCollection().find({});
    return new MongoResultSet<HubType, string>(cursor, dbo => dbo._id.toString());
  }
}
