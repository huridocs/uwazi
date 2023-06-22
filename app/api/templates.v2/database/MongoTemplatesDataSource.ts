import { MongoDataSource } from 'api/common.v2/database/MongoDataSource';
import { MongoIdHandler } from 'api/common.v2/database/MongoIdGenerator';
import { MongoResultSet } from 'api/common.v2/database/MongoResultSet';
import { objectIndex } from 'shared/data_utils/objectIndex';
import { TemplatesDataSource } from '../contracts/TemplatesDataSource';
import { Property } from '../model/Property';
import { RelationshipProperty } from '../model/RelationshipProperty';
import { mapPropertyQuery } from './QueryMapper';
import { TemplateDBO } from './schemas/TemplateDBO';
import { Template } from '../model/Template';
import { TemplateMappers } from './TemplateMappers';

export class MongoTemplatesDataSource
  extends MongoDataSource<TemplateDBO>
  // eslint-disable-next-line prettier/prettier
  implements TemplatesDataSource {
  protected collectionName = 'templates';

  private _nameToPropertyMap?: Record<string, Property>;

  private _allTemplates?: Template[];

  private _allTemplatesById?: Record<string, Template>;

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

  async getById(id: Template['id']): Promise<Template | undefined> {
    const [template] = await this.getCollection()
      .find({ _id: MongoIdHandler.mapToDb(id) })
      .toArray();

    return TemplateMappers.toApp(template);
  }
}
