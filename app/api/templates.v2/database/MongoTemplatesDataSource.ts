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
    const cursor = this.getCollection().aggregate(
      [
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
      ],
      { session: this.getSession() }
    );

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
      const templates = await this.getCollection()
        .find({}, { session: this.getSession() })
        .toArray();
      const properties = templates
        .map(t => t.properties.map(p => TemplateMappers.propertyDBOToApp(p, t._id)) || [])
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
    const cursor = this.getCollection().aggregate(
      [
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
      ],
      { session: this.getSession() }
    );

    return new MongoResultSet(cursor, template =>
      TemplateMappers.propertyDBOToApp(template.properties, template._id)
    );
  }

  getTemplatesIdsHavingProperty(propertyName: string) {
    const cursor = this.getCollection().find(
      { 'properties.name': propertyName },
      { projection: { _id: 1 }, session: this.getSession() }
    );
    return new MongoResultSet(cursor, template => MongoIdHandler.mapToApp(template._id));
  }

  getAllTemplatesIds() {
    const cursor = this.getCollection().find(
      {},
      { projection: { _id: 1 }, session: this.getSession() }
    );
    return new MongoResultSet(cursor, template => MongoIdHandler.mapToApp(template._id));
  }

  async getAllTemplates(forceRefresh: boolean = false): Promise<Template[]> {
    if (!this._allTemplates || forceRefresh) {
      const rawTemplates = await this.getCollection()
        .find({}, { session: this.getSession() })
        .toArray();
      this._allTemplates = rawTemplates.map(t => TemplateMappers.DBOToApp(t));
    }
    return this._allTemplates;
  }

  async getTemplateIdIndex(forceRefresh: boolean = false): Promise<Record<string, Template>> {
    if (!this._allTemplatesById || forceRefresh) {
      this._allTemplatesById = objectIndex(
        await this.getAllTemplates(forceRefresh),
        t => t.id,
        t => t
      );
    }
    return this._allTemplatesById;
  }

  async countQueriesUsing(templateId: string): Promise<number> {
    const relprops = this.getAllRelationshipProperties();
    let count = 0;
    await relprops.forEach(p => {
      const templatesInQuery = p.query
        .map(t => t.getTemplates())
        .flat()
        .map(r => r.templates)
        .flat();
      if (templatesInQuery.includes(templateId)) count += 1;
    });
    return count;
  }
}
