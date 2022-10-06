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
    if (toPerform.length) {
      await this.collection.bulkWrite(toPerform, {
        ordered: this.ordered,
        session: this.session,
      });
    }
  }

  async check() {
    if (this.actions.length >= this.stackLimit) {
      await this.flush();
    }
  }

  async insert(document: any) {
    this.actions.push({ insertOne: { document } });
    await this.check();
  }

  async insertMany(documents: any[]) {
    for (let i = 0; i < documents.length; i += 1) {
      const doc = documents[i];
      // eslint-disable-next-line no-await-in-loop
      await this.insert(doc);
    }
  }

  async delete(filter: any, collation?: any) {
    this.actions.push({ deleteOne: { filter, collation } });
    await this.check();
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
    await this.check();
  }

  public get actionCount() {
    return this.actions.length;
  }
}

export { BulkWriteStream };
