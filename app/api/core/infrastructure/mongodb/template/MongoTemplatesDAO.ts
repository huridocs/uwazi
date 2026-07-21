import { Db, ObjectId } from 'mongodb';
import { MongoDataSource } from '#api/core/infrastructure/mongodb/common/MongoDataSource.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { TemplateDBO } from './DBOs/TemplateDBO.js';
import { PropertyType } from '#api/core/domain/template/PropertyType.js';
import { PropertySchema } from '#shared/types/commonTypes.js';

type PropertyDescriptor = { name: string; type: PropertyType; inheritedType?: PropertyType };

const asString = (id: string | ObjectId): string => (typeof id === 'string' ? id : id.toString());

const asStrings = (ids: (string | ObjectId)[]): string[] => ids.map(asString);

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

  async getByContent(contentId: string): Promise<TemplateDBO[]> {
    return this.getCollection()
      .find({ 'properties.content': asString(contentId) })
      .toArray();
  }

  async getByContents(contentIds: string[]): Promise<TemplateDBO[]> {
    return this.getCollection()
      .find({ 'properties.content': { $in: asStrings(contentIds) } })
      .toArray();
  }

  async getByInheritedProperties(propertyIds: string[]): Promise<TemplateDBO[]> {
    return this.getCollection()
      .find({ 'properties.inherit.property': { $in: propertyIds } })
      .toArray();
  }

  async getByEntityViewPage(pageId: string): Promise<TemplateDBO[]> {
    return this.getCollection().find({ entityViewPage: pageId }).toArray();
  }

  async getByContentsOrUnrestrictedRelationship(contentIds: string[]): Promise<TemplateDBO[]> {
    return this.getCollection()
      .find({
        $or: [
          { 'properties.content': { $in: asStrings(contentIds) } },
          { properties: { $elemMatch: { type: 'relationship', content: null } } },
        ],
      })
      .toArray();
  }

  async countByThesauri(thesauriId: string): Promise<number> {
    return this.getCollection().countDocuments({ 'properties.content': asString(thesauriId) });
  }

  async findUsingRelationTypeInProp(
    relationTypeId: string
  ): Promise<Pick<TemplateDBO, '_id' | 'name'>[]> {
    return this.getCollection()
      .find({ 'properties.relationType': relationTypeId }, { projection: { name: 1 } })
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

  async getTemplatesIdsHavingProperty(propertyName: string): Promise<string[]> {
    const templates = await this.getCollection()
      .find({ 'properties.name': propertyName }, { projection: { _id: 1 } })
      .toArray();
    return templates.map(template => template._id.toString());
  }

  async isPropertyUnique(property: PropertySchema): Promise<boolean> {
    const count = await this.getCollection().countDocuments(
      {
        properties: {
          $elemMatch: {
            name: property.name,
            type: property.type,
            _id: { $ne: new ObjectId(property._id) },
          },
        },
      },
      { limit: 1 }
    );

    return count === 0;
  }

  async isTemplateUnique(name: string, excludingId?: string): Promise<boolean> {
    const filter: any = { name };
    if (excludingId) {
      filter._id = { $ne: new ObjectId(excludingId) };
    }

    const count = await this.getCollection().countDocuments(filter, { limit: 1 });

    return count === 0;
  }

  async findTemplatesReferencing(templateId: string): Promise<TemplateDBO[]> {
    return this.getCollection().find({ 'properties.content': templateId }).toArray();
  }

  async getReferencePropertyNames(): Promise<string[]> {
    const result = await this.getCollection()
      .aggregate([
        { $unwind: '$properties' },
        {
          $match: {
            'properties.type': { $in: ['select', 'multiselect', 'relationship'] },
          },
        },
        {
          $group: {
            _id: '$properties.name',
          },
        },
      ])
      .toArray();

    return result.map((doc: any) => doc._id);
  }

  async findTemplateIdsUsingThesaurus(thesaurusId: string): Promise<ObjectId[]> {
    const directTemplates = await this.getCollection()
      .find({ 'properties.content': thesaurusId })
      .project({ _id: 1 })
      .toArray();

    const relatedTemplates = await this.getCollection()
      .find({
        'properties.type': 'relationship',
        'properties.content': { $in: directTemplates.map(t => t._id.toString()) },
      })
      .project({ _id: 1 })
      .toArray();

    const allTemplates = [...directTemplates, ...relatedTemplates];

    return Array.from(new Set(allTemplates.map(t => t._id)));
  }
}

export { MongoTemplatesDAO };
export type { PropertyDescriptor };
