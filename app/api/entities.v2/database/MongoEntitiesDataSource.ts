import { BulkWriteStream } from 'api/common.v2/database/BulkWriteStream';
import { MongoDataSource } from 'api/common.v2/database/MongoDataSource';
import { MongoResultSet } from 'api/common.v2/database/MongoResultSet';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { MongoRelationshipsDataSource } from 'api/relationships.v2/database/MongoRelationshipsDataSource';
import { MatchQueryNode } from 'api/relationships.v2/model/MatchQueryNode';
import { MongoSettingsDataSource } from 'api/settings.v2/database/MongoSettingsDataSource';
import { mapPropertyQuery } from 'api/templates.v2/database/QueryMapper';
import { Db, ObjectId } from 'mongodb';
import { EntitiesDataSource } from '../contracts/EntitiesDataSource';
import { Entity } from '../model/Entity';

interface EntityDBOType {
  sharedId: string;
  language: string;
  template: ObjectId;
  metadata: Record<string, { value: string; label: string }[]>;
  obsoleteMetadata: string[];
}

interface EntityJoinTemplate extends EntityDBOType {
  joinedTemplate: {
    properties: {
      type: 'newRelationship';
      name: string;
      query: any;
    }[];
  }[];
}

async function entityMapper(this: MongoEntitiesDataSource, entity: EntityJoinTemplate) {
  const mappedMetadata: Record<string, { value: string; label: string }[]> = {};
  const stream = new BulkWriteStream<EntityDBOType>(this.getCollection(), this.getSession());
  await Promise.all(
    // eslint-disable-next-line max-statements
    entity.joinedTemplate[0]?.properties.map(async property => {
      if (property.type !== 'newRelationship') return;
      if ((entity.obsoleteMetadata || []).includes(property.name)) {
        const configuredQuery = mapPropertyQuery(property.query);
        const results = await this.relationshipsDS
          .getByQuery(
            new MatchQueryNode({ sharedId: entity.sharedId }, configuredQuery),
            entity.language
          )
          .all();
        mappedMetadata[property.name] = results.map(result => {
          const targetEntity = result.leaf() as { sharedId: string; title: string };
          return {
            value: targetEntity.sharedId,
            label: targetEntity.title,
          };
        });
        await stream.updateOne(
          { sharedId: entity.sharedId, language: entity.language },
          { $set: { metadata: { [property.name]: mappedMetadata[property.name] } } }
        );
        return;
      }

      mappedMetadata[property.name] = entity.metadata[property.name];
    }) || []
  );
  await stream.updateOne(
    { sharedId: entity.sharedId, language: entity.language },
    { $set: { obsoleteMetadata: [] } }
  );
  await stream.flush();
  return new Entity(
    entity.sharedId,
    entity.language,
    entity.template.toHexString(),
    mappedMetadata
  );
}

export class MongoEntitiesDataSource
  extends MongoDataSource<EntityDBOType>
  // eslint-disable-next-line prettier/prettier
  implements EntitiesDataSource {
  protected collectionName = 'entities';

  private settingsDS: MongoSettingsDataSource;

  protected relationshipsDS: MongoRelationshipsDataSource;

  constructor(
    db: Db,
    relationshipsDS: MongoRelationshipsDataSource,
    settingsDS: MongoSettingsDataSource,
    transactionManager: MongoTransactionManager
  ) {
    super(db, transactionManager);
    this.settingsDS = settingsDS;
    this.relationshipsDS = relationshipsDS;
  }

  async entitiesExist(sharedIds: string[]) {
    const languages = await this.settingsDS.getLanguageKeys();
    const countInExistence = await this.getCollection().countDocuments(
      { sharedId: { $in: sharedIds } },
      { session: this.getSession() }
    );
    return countInExistence === sharedIds.length * languages.length;
  }

  async markMetadataAsChanged(propData: { sharedId: string; propertiesToBeMarked: string[] }[]) {
    const stream = new BulkWriteStream<EntityDBOType>(this.getCollection(), this.getSession());
    for (let i = 0; i < propData.length; i += 1) {
      const data = propData[i];
      for (let j = 0; j < data.propertiesToBeMarked.length; j += 1) {
        const prop = data.propertiesToBeMarked[j];
        // eslint-disable-next-line no-await-in-loop
        await stream.updateMany(
          { sharedId: data.sharedId },
          { $addToSet: { obsoleteMetadata: prop } }
        );
      }
    }
    await stream.flush();
  }

  getByIds(sharedIds: string[], language?: string) {
    const match: { sharedId: { $in: string[] }; language?: string } = {
      sharedId: { $in: sharedIds },
    };
    if (language) match.language = language;
    const cursor = this.getCollection().aggregate<EntityJoinTemplate>(
      [
        { $match: match },
        {
          $lookup: {
            from: 'templates',
            localField: 'template',
            foreignField: '_id',
            as: 'joinedTemplate',
          },
        },
      ],
      { session: this.getSession() }
    );

    return new MongoResultSet(cursor, entityMapper.bind(this));
  }
}
