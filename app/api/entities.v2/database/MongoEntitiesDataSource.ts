import { BulkWriteStream } from 'api/common.v2/database/BulkWriteStream';
import { MongoDataSource } from 'api/common.v2/database/MongoDataSource';
import { MongoResultSet } from 'api/common.v2/database/MongoResultSet';
import { MongoGraphQueryParser } from 'api/relationships.v2/database/MongoGraphQueryParser';
import { MongoRelationshipsDataSource } from 'api/relationships.v2/database/MongoRelationshipsDataSource';
import { ObjectId } from 'mongodb';
import { PropertySchema } from 'shared/types/commonTypes';
import { EntitiesDataSource } from '../contracts/EntitiesDataSource';
import { Entity } from '../model/Entity';

export class MongoEntitiesDataSource extends MongoDataSource implements EntitiesDataSource {
  async entitiesExist(sharedIds: string[]) {
    const countInExistence = await this.db
      .collection('entities')
      .countDocuments({ sharedId: { $in: sharedIds } }, { session: this.session });
    return countInExistence === sharedIds.length;
  }

  async markMetadataAsChanged(propData: { sharedId: string; propertiesToBeMarked: string[] }[]) {
    const stream = new BulkWriteStream(this.db.collection('entities'));
    for (let i = 0; i < propData.length; i += 1) {
      const data = propData[i];
      for (let j = 0; j < data.propertiesToBeMarked.length; j += 1) {
        const prop = data.propertiesToBeMarked[j];
        // eslint-disable-next-line no-await-in-loop
        await stream.update(
          { sharedId: data.sharedId },
          { $push: { obsoleteMetadata: prop } },
          this.session
        );
      }
    }
    await stream.flush();
  }

  getByIds(sharedIds: string[]) {
    const cursor = this.db
      .collection<{
        sharedId: string;
        template: ObjectId;
        metadata: Record<string, { value: string; label: string }[]>;
        obsoleteMetadata: string[];
        joinedTemplate: any;
      }>('entities')
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

    return new MongoResultSet(
      cursor,
      async ({ sharedId, template, metadata, obsoleteMetadata, joinedTemplate }) => {
        const mappedMetadata: Record<string, { value: string; label: string }[]> = {};
        const relationshipsDS = new MongoRelationshipsDataSource(this.db);
        if (this.session) relationshipsDS.setTransactionContext(this.session);
        const stream = new BulkWriteStream(this.db.collection('entities'));
        await Promise.all(
          // eslint-disable-next-line max-statements
          joinedTemplate[0]?.properties.map(async (property: PropertySchema) => {
            if (property.type !== 'newRelationship') return;
            if ((obsoleteMetadata || []).includes(property.name)) {
              const parser = new MongoGraphQueryParser();
              const query = parser.parse({ ...property.query, sharedId });
              const result = relationshipsDS.getByModelQuery(query);
              const leafEntities = (await result.all()).map(path => path[path.length - 1]);
              mappedMetadata[property.name] = leafEntities.map(e => ({
                value: e.sharedId,
                label: e.sharedId,
              }));
              await stream.update(
                { sharedId },
                { $set: { [`metadata.${property.name}`]: mappedMetadata[property.name] } },
                this.session
              );
              return;
            }

            mappedMetadata[property.name] = metadata[property.name];
          }) || []
        );
        await stream.update({ sharedId }, { $set: { obsoleteMetadata: [] } }, this.session);
        await stream.flush();
        relationshipsDS.clearTransactionContext();
        return new Entity(sharedId, template.toHexString(), mappedMetadata);
      }
    );
  }
}
