import { MongoDataSource } from 'api/common.v2/database/MongoDataSource';
import { MongoIdHandler } from 'api/common.v2/database/MongoIdGenerator';
import { MongoResultSet } from 'api/common.v2/database/MongoResultSet';
import { ObjectId } from 'mongodb';
import { objectIndex } from 'shared/data_utils/objectIndex';
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

  async getById(id: Template['id']): Promise<Template | undefined> {
    return (await this.getByIds([id]).first()) || undefined;
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

  async setProcessingTotalJobs(id: Template['id'], totalJobs: number) {
    await this.getCollection().findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { 'processing.totalJobs': totalJobs, 'processing.active': true } }
    );
  }

  async completeProcessing(templateId: string) {
    await this.getCollection().findOneAndUpdate(
      { _id: new ObjectId(templateId) },
      { $unset: { processing: true } }
    );
  }
}
