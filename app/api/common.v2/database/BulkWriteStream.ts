import { ClientSession, Collection } from 'mongodb';

class BulkWriteStream {
  collection: Collection;

  stackLimit: number;

  ordered: boolean | undefined;

  session?: ClientSession;

  protected actions: any[];

  constructor(
    collection?: Collection,
    session?: ClientSession,
    stackLimit?: number,
    ordered?: boolean
  ) {
    if (!collection) throw new Error('Collection is required.');
    this.collection = collection;
    this.session = session;
    this.actions = [];
    this.stackLimit = stackLimit || 1000;
    this.ordered = ordered;
  }

  async flush() {
    const toPerform = this.actions;
    this.actions = [];
    return this.collection.bulkWrite(toPerform, { ordered: this.ordered, session: this.session });
  }

  async check() {
    if (this.actions.length >= this.stackLimit) {
      return this.flush();
    }
    return null;
  }

  async insert(document: any) {
    this.actions.push({ insertOne: { document } });
    return this.check();
  }

  async delete(filter: any, collation?: any) {
    this.actions.push({ deleteOne: { filter, collation } });
    return this.check();
  }

  async update(
    filter: any,
    update: any,
    upsert?: boolean,
    collation?: any,
    arrayFilters?: any[],
    hint?: any
  ) {
    this.actions.push({ updateOne: { filter, update, upsert, collation, arrayFilters, hint } });
    return this.check();
  }

  public get actionCount() {
    return this.actions.length;
  }
}

export { BulkWriteStream };
