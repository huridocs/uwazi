import { Db } from 'mongodb';
import { MongoDataSource } from '#api/core/infrastructure/mongodb/common/MongoDataSource.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { TemplateDBO } from './DBOs/TemplateDBO.js';
import { PropertyType } from '#api/core/domain/template/PropertyType.js';

type PropertyDescriptor = { name: string; type: PropertyType; inheritedType?: PropertyType };

type Deps = {
  db: Db;
  transactionManager: MongoTransactionManager;
};

class MongoTemplatesDAO extends MongoDataSource<TemplateDBO> {
  protected collectionName = 'templates';

  constructor(deps: Deps) {
    super(deps.db, deps.transactionManager);
  }

  async getAllFilterableProperties(): Promise<PropertyDescriptor[]> {
    const fromTemplates = await this.getCollection()
      .aggregate<PropertyDescriptor>([
        { $unwind: '$properties' },
        { $match: { 'properties.filter': true } },
        {
          $group: {
            _id: '$properties.name',
            type: { $first: '$properties.type' },
            inheritedType: { $first: '$properties.inherit.type' },
          },
        },
        {
          $project: {
            _id: 0,
            name: '$_id',
            type: 1,
            inheritedType: 1,
          },
        },
      ])
      .toArray();

    const title: PropertyDescriptor = { name: 'title', type: 'text' };
    return [title, ...fromTemplates];
  }
}

export { MongoTemplatesDAO };
export type { PropertyDescriptor };
