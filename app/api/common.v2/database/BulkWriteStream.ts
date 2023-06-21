import {
  AnyBulkWriteOperation,
  ClientSession,
  Collection,
  Filter,
  OptionalId,
  UpdateFilter,
  CollationOptions,
  UpdateManyModel,
} from 'mongodb';

class BulkWriteStream<CollSchema extends { [key: string]: any }> {
  collection: Collection<CollSchema>;

  stackLimit: number;

  ordered: boolean | undefined;

  session?: ClientSession;

  protected actions: Array<AnyBulkWriteOperation<CollSchema>>;

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

  async delete(filter: Filter<CollSchema>, collation?: CollationOptions) {
    this.actions.push({ deleteOne: { filter, collation } });
    await this.check();
  }

  async deleteMany(filter: Filter<CollSchema>, collation?: CollationOptions) {
    this.actions.push({ deleteMany: { filter, collation } });
    await this.check();
  }

  async updateOne(
    filter: Filter<CollSchema>,
    update: UpdateFilter<CollSchema>,
    upsert?: boolean,
    collation?: CollationOptions,
    arrayFilters?: object[]
  ) {
    this.actions.push({ updateOne: { filter, update, upsert, collation, arrayFilters } });
    await this.check();
  }

  async updateMany(
    filter: UpdateManyModel<CollSchema>['filter'],
    update: UpdateManyModel<CollSchema>['update'],
    options: Omit<UpdateManyModel<CollSchema>, 'filter' | 'update'> = {}
  ) {
    this.actions.push({ updateMany: { filter, update, ...options } });
    await this.check();
  }

  public get actionCount() {
    return this.actions.length;
  }
}

export { BulkWriteStream };
