import { BulkWriteStream } from 'api/common.v2/database/BulkWriteStream';
import { MongoDataSource } from 'api/common.v2/database/MongoDataSource';
import { MongoResultSet } from 'api/common.v2/database/MongoResultSet';
import { MongoRelationshipsDataSource } from 'api/relationships.v2/database/MongoRelationshipsDataSource';
import { MatchQueryNode } from 'api/relationships.v2/model/MatchQueryNode';
import { mapPropertyQuery } from 'api/templates.v2/database/QueryMapper';
import { ObjectId } from 'mongodb';
import { PropertySchema } from 'shared/types/commonTypes';
import { EntitiesDataSource } from '../contracts/EntitiesDataSource';
import { Entity } from '../model/Entity';

interface EntityJoinTemplate {
  sharedId: string;
  template: ObjectId;
  metadata: Record<string, { value: string; label: string }[]>;
  obsoleteMetadata: string[];
  joinedTemplate: any;
}

async function entityMapper<T extends MongoDataSource>(this: T, entity: EntityJoinTemplate) {
  const mappedMetadata: Record<string, { value: string; label: string }[]> = {};
  const relationshipsDS = new MongoRelationshipsDataSource(this.db);
  if (this.session) relationshipsDS.setTransactionContext(this.session);
  const stream = new BulkWriteStream(this.getCollection(), this.session);
  await Promise.all(
    // eslint-disable-next-line max-statements
    entity.joinedTemplate[0]?.properties.map(async (property: PropertySchema) => {
      if (property.type !== 'newRelationship') return;
      if ((entity.obsoleteMetadata || []).includes(property.name)) {
        const configuredQuery = mapPropertyQuery(property.query);
        const result = relationshipsDS.getByQuery(
          new MatchQueryNode({ sharedId: entity.sharedId }, configuredQuery)
        );
        const leafEntities = (await result.all()).map(path => path[path.length - 1]);
        mappedMetadata[property.name] = leafEntities.map(e => ({
          value: e.sharedId,
          label: e.sharedId,
        }));
        await stream.update(
          { sharedId: entity.sharedId },
          { $set: { [`metadata.${property.name}`]: mappedMetadata[property.name] } }
        );
        return;
      }

      mappedMetadata[property.name] = entity.metadata[property.name];
    }) || []
  );
  await stream.update({ sharedId: entity.sharedId }, { $set: { obsoleteMetadata: [] } });
  await stream.flush();
  relationshipsDS.clearTransactionContext();
  return new Entity(entity.sharedId, entity.template.toHexString(), mappedMetadata);
}

export class MongoEntitiesDataSource extends MongoDataSource implements EntitiesDataSource {
  protected collectionName = 'entities';

  async entitiesExist(sharedIds: string[]) {
    const countInExistence = await this.getCollection().countDocuments(
      { sharedId: { $in: sharedIds } },
      { session: this.session }
    );
    return countInExistence === sharedIds.length;
  }

  async markMetadataAsChanged(propData: { sharedId: string; propertiesToBeMarked: string[] }[]) {
    const stream = new BulkWriteStream(this.getCollection(), this.session);
    for (let i = 0; i < propData.length; i += 1) {
      const data = propData[i];
      for (let j = 0; j < data.propertiesToBeMarked.length; j += 1) {
        const prop = data.propertiesToBeMarked[j];
        // eslint-disable-next-line no-await-in-loop
        await stream.update({ sharedId: data.sharedId }, { $addToSet: { obsoleteMetadata: prop } });
      }
    }
    await stream.flush();
  }

  getByIds(sharedIds: string[]) {
    const cursor = this.getCollection().aggregate<EntityJoinTemplate>(
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

    return new MongoResultSet(cursor, entityMapper.bind(this));
  }
}
