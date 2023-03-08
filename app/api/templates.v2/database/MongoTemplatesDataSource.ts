import { MongoDataSource } from 'api/common.v2/database/MongoDataSource';
import { MongoIdHandler } from 'api/common.v2/database/MongoIdGenerator';
import { MongoResultSet } from 'api/common.v2/database/MongoResultSet';
import { objectIndex } from 'shared/data_utils/objectIndex';
import { propertyTypes } from 'shared/propertyTypes';
import { TemplatesDataSource } from '../contracts/TemplatesDataSource';
import { Property } from '../model/Property';
import { RelationshipProperty } from '../model/RelationshipProperty';
import { mapPropertyQuery } from './QueryMapper';
import { TemplateDBO } from './schemas/TemplateDBO';

type PropertyDBO = TemplateDBO['properties'][number];

const propertyToApp = (property: PropertyDBO, templateId: TemplateDBO['_id']): Property => {
  const id = MongoIdHandler.mapToApp(templateId);
  if (property.type === propertyTypes.newRelationship) {
    return new RelationshipProperty(
      property.name,
      property.label,
      mapPropertyQuery(property.query),
      id,
      property.denormalizedProperty
    );
  }
  return new Property(property.type, property.name, property.label, id);
};

export class MongoTemplatesDataSource
  extends MongoDataSource<TemplateDBO>
  // eslint-disable-next-line prettier/prettier
  implements TemplatesDataSource {
  protected collectionName = 'templates';

  private _nameToPropertyMap?: Record<string, Property>;

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
        .map(t => t.properties.map(p => propertyToApp(p, t._id)) || [])
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

    return new MongoResultSet(cursor, template => propertyToApp(template.properties, template._id));
  }
}
