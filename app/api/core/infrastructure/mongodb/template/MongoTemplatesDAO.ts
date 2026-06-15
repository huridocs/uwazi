import { Db, ObjectId } from 'mongodb';
import { MongoDataSource } from '#api/core/infrastructure/mongodb/common/MongoDataSource.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { TemplateDBO } from './DBOs/TemplateDBO.js';
import { PropertyType } from '#api/core/domain/template/PropertyType.js';
import { PropertySchema } from '#shared/types/commonTypes.js';

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

  async get(ids?: string[]): Promise<TemplateDBO[]> {
    if (ids !== undefined) {
      const objectIds = ids.map(id => new ObjectId(id));
      return this.getCollection()
        .find({ _id: { $in: objectIds } })
        .toArray();
    }
    return this.getCollection().find({}).toArray();
  }

  async getByNames(names: string[]): Promise<TemplateDBO[]> {
    return this.getCollection()
      .find({ name: { $in: names } })
      .toArray();
  }

  async getDefaultTemplate(): Promise<TemplateDBO | null> {
    const template = await this.getCollection().findOne({ default: true });
    return template || null;
  }

  async getAllIds(): Promise<string[]> {
    return this.getCollection()
      .find({}, { projection: { _id: 1 } })
      .map(template => template._id.toHexString())
      .toArray();
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

  async getPropertyByName(name: string): Promise<PropertySchema | undefined> {
    const template = await this.getCollection().findOne({
      $or: [{ 'properties.name': name }, { 'commonProperties.name': name }],
    });

    if (!template) {
      return undefined;
    }

    const property = [...(template.properties || []), ...(template.commonProperties || [])].find(
      p => p.name === name
    );

    return property;
  }
}

export { MongoTemplatesDAO };
export type { PropertyDescriptor };
