import {
  BulkWriteOperation,
  ClientSession,
  Collection,
  FilterQuery,
  OptionalId,
  UpdateQuery,
} from 'mongodb';

class BulkWriteStream<CollSchema extends { [key: string]: any }> {
  collection: Collection<CollSchema>;

  stackLimit: number;

  ordered: boolean | undefined;

  session?: ClientSession;

  protected actions: Array<BulkWriteOperation<CollSchema>>;

  constructor(
    collection?: Collection<CollSchema>,
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

  async insert(document: OptionalId<CollSchema>) {
    this.actions.push({ insertOne: { document } });
    await this.check();
  }

  async insertMany(documents: OptionalId<CollSchema>[]) {
    for (let i = 0; i < documents.length; i += 1) {
      const doc = documents[i];
      // eslint-disable-next-line no-await-in-loop
      await this.insert(doc);
    }
  }

  async delete(filter: FilterQuery<CollSchema>, collation?: object | undefined) {
    this.actions.push({ deleteOne: { filter, collation } });
    await this.check();
  }

  async update(
    filter: FilterQuery<CollSchema>,
    update: UpdateQuery<CollSchema>,
    upsert?: boolean,
    collation?: object,
    arrayFilters?: object[]
  ) {
    this.actions.push({ updateOne: { filter, update, upsert, collation, arrayFilters } });
    await this.check();
  }

  public get actionCount() {
    return this.actions.length;
  }
}

export { BulkWriteStream };
