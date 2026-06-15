/* eslint-disable max-lines */
import { Db, ObjectId } from 'mongodb';
import {
  MongoDataSource,
  MongoDSOptions,
} from '#api/core/infrastructure/mongodb/common/MongoDataSource.js';
import { MongoIdHandler } from '#api/core/infrastructure/mongodb/common/MongoIdGenerator.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import {
  DefaultTemplateNotFoundError,
  TemplateDoesNotExistError,
} from '#api/core/domain/template/errors.js';
import { GenerateIdProperty } from '#api/core/domain/template/GenerateIdProperty.js';
import { Result, ResultType } from '#api/core/libs/Result.js';
import { resetIndex, updateMapping } from '#api/search/entitiesIndex.js';
import { Property } from '../../../domain/template/Property.js';
import { RelationshipProperty } from '../../../domain/template/RelationshipProperty.js';
import { Template } from '../../../domain/template/Template.js';
import { TemplatesDataSource } from '../../../application/contracts/TemplatesDataSource.js';
import { V1RelationshipProperty } from '../../../domain/template/V1RelationshipProperty.js';
import { TemplateDBO } from './DBOs/TemplateDBO.js';
import { MongoTemplateMapper, MongoTemplatePropertyMapper } from './MongoTemplateMapper.js';
import { mapPropertyQuery } from './QueryMapper.js';
import { MongoTemplatesDAO } from './MongoTemplatesDAO.js';

type MongoTemplatesDataSourceDeps = {
  db: Db;
  transactionManager: MongoTransactionManager;
  options?: MongoDSOptions;
};

export class MongoTemplatesDataSource
  extends MongoDataSource<TemplateDBO>
  implements TemplatesDataSource
{
  protected collectionName = 'templates';

  private dao: MongoTemplatesDAO;

  private templatesMutated = new Map<ObjectId, TemplateDBO>();

  constructor(deps: MongoTemplatesDataSourceDeps) {
    super(deps.db, deps.transactionManager, deps.options);

    this.dao = new MongoTemplatesDAO({
      db: deps.db,
      transactionManager: deps.transactionManager,
    });

    this.transactionManager.onCommitted(async () => {
      const templates = [...this.templatesMutated.values()];
      this.templatesMutated.clear();
      if (templates.length > 0) {
        await updateMapping(templates);
      }
    });
  }

  async updateMapping(template: Template, reset = false) {
    if (reset) {
      await resetIndex();
      return updateMapping(await this.getCollection().find({}).toArray());
    }
    return updateMapping([MongoTemplateMapper.toSchema(template)]);
  }

  async getAll(): Promise<Template[]> {
    const templates = await this.dao.get();
    return templates.map(MongoTemplateMapper.toDomain);
  }

  async getAllRelationshipProperties(): Promise<RelationshipProperty[]> {
    const cursor = this.getCollection().aggregate([
      {
        $match: {
          'properties.type': 'newRelationship',
        },
      },
      { $unwind: '$properties' },
      {
        $match: {
          'properties.type': 'newRelationship',
        },
      },
      {
        $project: {
          _id: 1,
          properties: 1,
        },
      },
    ]);

    const dbos = await cursor.toArray();
    return dbos.map(
      template =>
        new RelationshipProperty(
          template.properties._id,
          template.properties.name,
          template.properties.label,
          mapPropertyQuery(template.properties.query),
          MongoIdHandler.mapToApp(template._id),
          template.properties.denormalizedProperty
        )
    );
  }

  async getGeneratedIdPropertiesByIds(propertyIds: string[]): Promise<GenerateIdProperty[]> {
    const cursor = this.getCollection().aggregate([
      { $unwind: '$properties' },
      {
        $match: {
          'properties._id': { $in: propertyIds.map(id => new ObjectId(id)) },
        },
      },
      {
        $project: {
          _id: 1,
          properties: 1,
        },
      },
    ]);

    const dbos = await cursor.toArray();
    return dbos.map(
      template =>
        new GenerateIdProperty({
          id: template.properties._id,
          name: template.properties.name,
          label: template.properties.label,
          template: template._id,
        })
    );
  }

  async getV1RelationshipPropertiesByIds(propertyIds: string[]): Promise<V1RelationshipProperty[]> {
    const cursor = this.getCollection().aggregate([
      { $unwind: '$properties' },
      {
        $match: {
          'properties.type': 'relationship',
          'properties._id': { $in: propertyIds.map(id => new ObjectId(id)) },
        },
      },
      {
        $project: {
          _id: 1,
          properties: 1,
        },
      },
    ]);

    const dbos = await cursor.toArray();
    return dbos.map(
      template =>
        new V1RelationshipProperty(
          template.properties._id,
          template.properties.name,
          template.properties.label,
          template.properties.relationType,
          template._id,
          template.properties.content,
          template.properties.inherit?.property
        )
    );
  }

  async getAllTextProperties(): Promise<Property[]> {
    const cursor = this.getCollection().aggregate([
      {
        $addFields: {
          textProperty: {
            $concatArrays: ['$commonProperties', '$properties'],
          },
        },
      },
      { $unwind: '$textProperty' },
      {
        $match: {
          'textProperty.type': { $in: ['text', 'markdown'] },
        },
      },
      {
        $project: {
          _id: 1,
          textProperty: 1,
        },
      },
    ]);

    const dbos = await cursor.toArray();
    return dbos.map(template =>
      MongoTemplatePropertyMapper.toDomain(template.textProperty, template._id.toString())
    );
  }

  async getPropertyByName(name: string): Promise<Property> {
    const property = await this.dao.getPropertyByName(name);

    if (!property) {
      throw new Error(`Property not found: ${name}`);
    }

    return MongoTemplatePropertyMapper.toDomain(property, property._id!.toString());
  }

  async getPropertiesBeingInherited(properties: Property[]): Promise<Property[]> {
    const cursor = this.getCollection().aggregate([
      {
        $match: { 'properties.inherit.property': { $in: properties.map(p => p.id) } },
      },
      { $unwind: '$properties' },
      {
        $match: { 'properties.inherit.property': { $in: properties.map(p => p.id) } },
      },
      { $project: { inheritedProperty: '$properties.inherit.property' } },
      {
        $group: { _id: null, inheritedProperties: { $push: '$inheritedProperty' } },
      },
    ]);

    const result = await cursor.toArray();
    if (result.length) {
      const { inheritedProperties } = result[0];
      return properties.filter(p => inheritedProperties.includes(p.id));
    }
    return [];
  }

  async getAllProperties(): Promise<Property[]> {
    const cursor = this.getCollection().aggregate([
      {
        $match: {},
      },
      { $unwind: '$properties' },
      {
        $project: {
          _id: 1,
          properties: 1,
        },
      },
    ]);

    const dbos = await cursor.toArray();
    return dbos.map(template =>
      MongoTemplatePropertyMapper.toDomain(template.properties, template._id.toString())
    );
  }

  async getTemplatesIdsHavingProperty(propertyName: string): Promise<string[]> {
    const templates = await this.getCollection()
      .find({ 'properties.name': propertyName }, { projection: { _id: 1 } })
      .toArray();
    return templates.map(template => MongoIdHandler.mapToApp(template._id));
  }

  async getAllTemplatesIds(): Promise<string[]> {
    return this.dao.getAllIds();
  }

  async getByIds(ids: Template['id'][]): Promise<Template[]> {
    const templates = await this.dao.get(ids);
    return templates.map(MongoTemplateMapper.toDomain);
  }

  async getByNames(names: Template['name'][]): Promise<Template[]> {
    const templates = await this.dao.getByNames(names);
    return templates.map(MongoTemplateMapper.toDomain);
  }

  async getById(id: string): Promise<ResultType<Template, TemplateDoesNotExistError>> {
    const templates = await this.dao.get([id]);

    if (!templates.length) {
      return Result.fail(new TemplateDoesNotExistError(id));
    }

    return Result.ok(MongoTemplateMapper.toDomain(templates[0]));
  }

  async incrementProcessingTracking(id: Template['id']) {
    const result = await this.getCollection().findOneAndUpdate(
      { _id: new ObjectId(id) },
      // @ts-ignore when updating nested objects ts cant infer the proper type
      { $inc: { 'processing.completedJobs': 1 } },
      { returnDocument: 'after' }
    );
    return {
      total: result?.processing?.totalJobs || 1,
      completed: result?.processing?.completedJobs || 0,
    };
  }

  async addJobsToProcessingCount(id: Template['id'], totalJobs: number) {
    await this.getCollection().findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: { 'processing.active': true },
        // @ts-ignore when updating nested objects ts cant infer the proper type
        $inc: { 'processing.totalJobs': totalJobs },
      }
    );
  }

  async completeProcessing(templateId: string) {
    await this.getCollection().findOneAndUpdate(
      { _id: new ObjectId(templateId) },
      { $unset: { processing: true } }
    );
  }

  async update(template: Template): Promise<void> {
    const schema = MongoTemplateMapper.toSchema(template);
    await this.getCollection().updateOne({ _id: new ObjectId(template.id) }, { $set: schema });
    this.templatesMutated.set(schema._id, schema);
  }

  async create(template: Template): Promise<void> {
    const schema = MongoTemplateMapper.toSchema(template);
    await this.getCollection().insertOne(schema);
    this.templatesMutated.set(schema._id, schema);
  }

  async isPropertyUnique(property: Property): Promise<boolean> {
    const count = await this.getCollection().countDocuments(
      {
        properties: {
          $elemMatch: {
            name: property.name,
            type: property.type,
            _id: { $ne: ObjectId.createFromHexString(property.id) },
          },
        },
      },
      { limit: 1 }
    );

    return count === 0;
  }

  async isTemplateUnique(template: Template): Promise<boolean> {
    const count = await this.getCollection().countDocuments(
      {
        name: template.name,
      },
      { limit: 1 }
    );

    return count === 0;
  }

  async getTemplatesByPropertyName(property: Property): Promise<Template[]> {
    const schemas = await this.getCollection()
      .find({
        _id: { $not: { $eq: new ObjectId(property.template) } },
        properties: {
          $elemMatch: {
            name: property.name,
          },
        },
      })
      .toArray();

    return schemas.map(MongoTemplateMapper.toDomain);
  }

  async getDefaultTemplate(): Promise<ResultType<Template, DefaultTemplateNotFoundError>> {
    const template = await this.dao.getDefaultTemplate();

    if (!template) {
      return Result.fail(new DefaultTemplateNotFoundError());
    }

    return Result.ok(MongoTemplateMapper.toDomain(template));
  }

  async countByThesauri(thesaurusId: string): Promise<number> {
    return this.getCollection().countDocuments({ 'properties.content': thesaurusId }, { limit: 1 });
  }

  async findTemplatesReferencing(templateId: string): Promise<Template[]> {
    const schemas = await this.getCollection()
      .find({
        'properties.content': templateId,
      })
      .toArray();

    return schemas.map(MongoTemplateMapper.toDomain);
  }

  async delete(templateId: string): Promise<void> {
    await this.getCollection().deleteOne({ _id: new ObjectId(templateId) });
  }

  async bulkUpdate(template: Template[]): Promise<void> {
    const schemas = template.map(MongoTemplateMapper.toSchema);

    await this.getCollection().bulkWrite(
      schemas.map(schema => ({
        updateOne: {
          filter: { _id: schema._id },
          update: { $set: schema },
        },
      }))
    );

    schemas.forEach(schema => this.templatesMutated.set(schema._id, schema));
  }
}

export type { MongoTemplatesDataSourceDeps };
