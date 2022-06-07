import { OdmModel } from 'api/odm/model';
import { MultiTenantMongooseModel } from 'api/odm/MultiTenantMongooseModel';

class ModelBulkWriteStream {
  db: MultiTenantMongooseModel<any>;

  stackLimit: number;

  ordered: boolean | undefined;

  actions: any[];

  constructor(uwaziModel: OdmModel<any>, stackLimit?: number, ordered?: boolean) {
    this.db = uwaziModel.db;
    this.actions = [];
    this.stackLimit = stackLimit || 1000;
    this.ordered = ordered;
  }

  async flush() {
    const toPerform = this.actions;
    this.actions = [];
    return this.db.bulkWrite(toPerform, { ordered: this.ordered });
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
}

export { ModelBulkWriteStream };
