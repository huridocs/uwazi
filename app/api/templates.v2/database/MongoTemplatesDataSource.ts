import { MongoDataSource } from 'api/common.v2/database/MongoDataSource';
import { MongoIdHandler } from 'api/common.v2/database/MongoIdGenerator';
import { MongoResultSet } from 'api/common.v2/database/MongoResultSet';
import { objectIndex } from 'shared/data_utils/objectIndex';
import { TemplatesDataSource } from '../contracts/TemplatesDataSource';
import { Property } from '../model/Property';
import { RelationshipProperty } from '../model/RelationshipProperty';
import { mapPropertyQuery } from './QueryMapper';
import { TemplateDBO } from './schemas/TemplateDBO';

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
        .map(
          t =>
            t.properties.map(
              p => new Property(p.type, p.name, p.label, MongoIdHandler.mapToApp(t._id))
            ) || []
        )
        .flat();
      this._nameToPropertyMap = objectIndex(
        properties,
        p => p.name,
        p => p
      );
    }
    return this._nameToPropertyMap[name];
  }
}
