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

  async getAllProperties(): Promise<PropertyDescriptor[]> {
    return this.getCollection()
      .aggregate<PropertyDescriptor>([
        { $unwind: '$properties' },
        {
          $project: {
            _id: 0,
            name: '$properties.name',
            type: '$properties.type',
            inheritedType: '$properties.inherit.type',
          },
        },
      ])
      .toArray();
  }
}

export { MongoTemplatesDAO };
export type { PropertyDescriptor };
