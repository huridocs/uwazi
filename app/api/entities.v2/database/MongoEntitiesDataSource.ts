import { MongoDataSource } from 'api/common.v2/database/MongoDataSource';
import { MongoResultSet } from 'api/common.v2/database/MongoResultSet';
import { MongoGraphQueryParser } from 'api/relationships.v2/database/MongoGraphQueryParser';
import { MongoRelationshipsDataSource } from 'api/relationships.v2/database/MongoRelationshipsDataSource';
import { ObjectId } from 'mongodb';
import { EntitiesDataSource } from '../contracts/EntitiesDataSource';
import { Entity } from '../model/Entity';

export class MongoEntitiesDataSource extends MongoDataSource implements EntitiesDataSource {
  async entitiesExist(sharedIds: string[]) {
    const countInExistence = await this.db
      .collection('entities')
      .countDocuments({ sharedId: { $in: sharedIds } }, { session: this.session });
    return countInExistence === sharedIds.length;
  }

  getByIds(sharedIds: string[]) {
    const cursor = this.db
      .collection<{ sharedId: string; template: ObjectId; metadata: object; joinedTemplate: any }>(
        'entities'
      )
      .aggregate(
        [
          { $match: { sharedId: { $in: sharedIds } } },
          {
            $lookup: {
              from: 'templates',
              localField: 'template',
              foreignField: '_id',
              as: 'joinedTemplate',
            },
          },
        ],
        { session: this.session }
      );

    return new MongoResultSet(cursor, async ({ sharedId, template, joinedTemplate }) => {
      const mappedMetadata: Record<string, { value: string; label: string }[]> = {};
      await Promise.all(
        joinedTemplate[0].properties.map(async (property: any) => {
          if (property.type !== 'newRelationship') return;

          const parser = new MongoGraphQueryParser();
          const query = parser.parse({ ...property.query, sharedId });
          const relationshipsDS = new MongoRelationshipsDataSource(this.db);
          const result = relationshipsDS.getByModelQuery(query);
          const leafEntities = (await result.all()).map(path => path[path.length - 1]);
          mappedMetadata[property.name] = leafEntities.map(e => ({
            value: e.sharedId,
            label: e.sharedId,
          }));
        })
      );
      return new Entity(sharedId, template.toHexString(), mappedMetadata);
    });
  }
}
