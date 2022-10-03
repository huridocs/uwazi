import { ClientSession, Collection } from 'mongodb';

class BulkWriteStream {
  collection: Collection;

  stackLimit: number;

  ordered: boolean | undefined;

  actions: any[];

  constructor(collection?: Collection, stackLimit?: number, ordered?: boolean) {
    if (!collection) throw new Error('Collection is required.');
    this.collection = collection;
    this.actions = [];
    this.stackLimit = stackLimit || 1000;
    this.ordered = ordered;
  }

  async flush(session?: ClientSession) {
    const toPerform = this.actions;
    this.actions = [];
    return this.collection.bulkWrite(toPerform, { ordered: this.ordered, session });
  }

  async check(session?: ClientSession) {
    if (this.actions.length >= this.stackLimit) {
      return this.flush(session);
    }
    return null;
  }

  async insert(document: any, session?: ClientSession) {
    this.actions.push({ insertOne: { document } });
    return this.check(session);
  }

  async delete(filter: any, session?: ClientSession, collation?: any) {
    this.actions.push({ deleteOne: { filter, collation } });
    return this.check(session);
  }

  async update(
    filter: any,
    update: any,
    session?: ClientSession,
    upsert?: boolean,
    collation?: any,
    arrayFilters?: any[],
    hint?: any
  ) {
    this.actions.push({ updateOne: { filter, update, upsert, collation, arrayFilters, hint } });
    return this.check(session);
  }
}

export { BulkWriteStream };
