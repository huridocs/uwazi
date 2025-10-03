/* eslint-disable max-lines */
import { MongoDataSource, MongoDSOptions } from 'api/common.v2/database/MongoDataSource';
import { MongoIdHandler } from 'api/common.v2/database/MongoIdGenerator';
import { MongoResultSet } from 'api/common.v2/database/MongoResultSet';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { GenerateIdProperty } from 'api/core/domain/template/GenerateIdProperty';
import { TemplateMapper } from 'api/core/infrastructure/mongodb/template/Mapper';
import { resetIndex, updateMapping } from 'api/search/entitiesIndex';
import { Db, ObjectId } from 'mongodb';
import { objectIndex } from 'shared/data_utils/objectIndex';
import {
  DefaultTemplateNotFoundError,
  TemplateDoesNotExistError,
} from 'api/core/domain/template/errors';
import { Result, ResultType } from 'api/core/application/common/Result';
import { TemplatesDataSource } from '../contracts/TemplatesDataSource';
import { Property } from '../model/Property';
import { RelationshipProperty } from '../model/RelationshipProperty';
import { Template } from '../model/Template';
import { V1RelationshipProperty } from '../model/V1RelationshipProperty';
import { mapPropertyQuery } from './QueryMapper';
import { TemplateDBO } from './schemas/TemplateDBO';
import { TemplateMappers } from './TemplateMappers';

export class MongoTemplatesDataSource
  extends MongoDataSource<TemplateDBO>
  implements TemplatesDataSource
{
  protected collectionName = 'templates';

  private _nameToPropertyMap?: Record<string, Property>;

  private templatesMutated = new Map<ObjectId, TemplateDBO>();

  constructor(db: Db, transactionManager: MongoTransactionManager, options?: MongoDSOptions) {
    super(db, transactionManager, options);

    this.transactionManager.onCommitted(async () => {
      const templates = [...this.templatesMutated.values()];
      this.templatesMutated.clear();
      await updateMapping(templates);
    });
  }

  async updateMapping(template: Template, reset = false) {
    if (reset) {
      await resetIndex();
      return updateMapping(await this.getCollection().find({}).toArray());
    }
    return updateMapping([TemplateMapper.toSchema(template)]);
  }

  getAll() {
    return new MongoResultSet(this.getCollection().find({}), TemplateMappers.toApp);
  }

  getAllRelationshipProperties() {
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

    return new MongoResultSet(
      cursor,
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

  getGeneratedIdPropertiesByIds(propertyIds: string[]) {
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
    return new MongoResultSet(
      cursor,
      template =>
        new GenerateIdProperty({
          id: template.properties._id,
          name: template.properties.name,
          label: template.properties.label,
          template: template._id,
        })
    );
  }

  getV1RelationshipPropertiesByIds(propertyIds: string[]) {
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

    return new MongoResultSet(
      cursor,
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

  getAllTextProperties() {
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

    return new MongoResultSet(cursor, template =>
      TemplateMappers.propertyToApp(template.textProperty, template._id)
    );
  }

  async getPropertyByName(name: string) {
    if (!this._nameToPropertyMap) {
      const templates = await this.getCollection().find({}).toArray();
      const properties = templates
        .map(t => t.properties.map(p => TemplateMappers.propertyToApp(p, t._id)) || [])
        .flat();
      this._nameToPropertyMap = objectIndex(
        properties,
        p => p.name,
        p => p
      );
    }
    return this._nameToPropertyMap[name];
  }

  getAllProperties() {
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

    return new MongoResultSet(cursor, template =>
      TemplateMappers.propertyToApp(template.properties, template._id)
    );
  }

  getTemplatesIdsHavingProperty(propertyName: string) {
    const cursor = this.getCollection().find(
      { 'properties.name': propertyName },
      { projection: { _id: 1 } }
    );
    return new MongoResultSet(cursor, template => MongoIdHandler.mapToApp(template._id));
  }

  getAllTemplatesIds() {
    const cursor = this.getCollection().find({}, { projection: { _id: 1 } });
    return new MongoResultSet(cursor, template => MongoIdHandler.mapToApp(template._id));
  }

  getByIds(ids: Template['id'][]) {
    const templatesCursor = this.getCollection().find({
      _id: { $in: ids.map(MongoIdHandler.mapToDb) },
    });

    return new MongoResultSet(templatesCursor, TemplateMappers.toApp);
  }

  getByNames(names: Template['name'][]) {
    const templatesCursor = this.getCollection().find({
      name: { $in: names },
    });

    return new MongoResultSet(templatesCursor, TemplateMappers.toApp);
  }

  async getById(id: string): Promise<ResultType<Template, TemplateDoesNotExistError>> {
    const schema = await this.getCollection().findOne({ _id: new ObjectId(id) });

    if (!schema) {
      return Result.fail(new TemplateDoesNotExistError(id));
    }

    return Result.ok(TemplateMapper.toDomain(schema));
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
    const schema = TemplateMapper.toSchema(template);
    await this.getCollection().updateOne({ _id: new ObjectId(template.id) }, { $set: schema });
    this.templatesMutated.set(schema._id, schema);
  }

  async create(template: Template): Promise<void> {
    const schema = TemplateMapper.toSchema(template);
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

    return schemas.map(TemplateMapper.toDomain);
  }

  async getDefaultTemplate(): Promise<ResultType<Template, DefaultTemplateNotFoundError>> {
    const schema = await this.getCollection().findOne({ default: true });
    if (!schema) {
      return Result.fail(new DefaultTemplateNotFoundError());
    }

    return Result.ok(TemplateMapper.toDomain(schema));
  }

  async findTemplatesReferencing(templateId: string): Promise<Template[]> {
    const schemas = await this.getCollection()
      .find({
        'properties.content': templateId,
      })
      .toArray();

    return schemas.map(TemplateMapper.toDomain);
  }

  async delete(templateId: string): Promise<void> {
    await this.getCollection().deleteOne({ _id: new ObjectId(templateId) });
  }

  async bulkUpdate(template: Template[]): Promise<void> {
    const schemas = template.map(TemplateMapper.toSchema);

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
