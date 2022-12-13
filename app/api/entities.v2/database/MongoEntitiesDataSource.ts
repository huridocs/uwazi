import { ResultSet } from 'api/common.v2/contracts/ResultSet';
import { MongoDataSource } from 'api/common.v2/database/MongoDataSource';
import { MongoResultSet } from 'api/common.v2/database/MongoResultSet';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { MongoRelationshipsDataSource } from 'api/relationships.v2/database/MongoRelationshipsDataSource';
import { GraphQueryResultView } from 'api/relationships.v2/model/GraphQueryResultView';
import { MatchQueryNode } from 'api/relationships.v2/model/MatchQueryNode';
import { MongoSettingsDataSource } from 'api/settings.v2/database/MongoSettingsDataSource';
import { MongoTemplatesDataSource } from 'api/templates.v2/database/MongoTemplatesDataSource';
import { mapPropertyQuery } from 'api/templates.v2/database/QueryMapper';
import { Db } from 'mongodb';
import { EntitiesDataSource } from '../contracts/EntitiesDataSource';
import { EntityMappers } from './EntityMapper';
import { EntityDBO, EntityJoinTemplate } from './schemas/EntityTypes';

async function defineGraphView(
  mongoDS: MongoEntitiesDataSource,
  property: EntityJoinTemplate['joinedTemplate'][0]['properties'][0]
) {
  // eslint-disable-next-line dot-notation
  const templateDataSource = mongoDS['templatesDS'];
  const denormalizedProperty = property.denormalizedProperty
    ? await templateDataSource.getPropertyByName(property.denormalizedProperty)
    : undefined;
  return denormalizedProperty
    ? new GraphQueryResultView(denormalizedProperty)
    : new GraphQueryResultView();
}

async function entityMapper(this: MongoEntitiesDataSource, entity: EntityJoinTemplate) {
  const mappedMetadata: Record<string, { value: string; label: string }[]> = {};
  const stream = this.createBulkStream();

  await Promise.all(
    // eslint-disable-next-line max-statements
    entity.joinedTemplate[0]?.properties.map(async property => {
      if (
        property.type === 'newRelationship' &&
        (entity.obsoleteMetadata || []).includes(property.name)
      ) {
        const configuredQuery = mapPropertyQuery(property.query);
        const configuredView = await defineGraphView(this, property);
        const results = await this.relationshipsDS
          .getByQuery(
            new MatchQueryNode({ sharedId: entity.sharedId }, configuredQuery),
            entity.language
          )
          .all();
        mappedMetadata[property.name] = configuredView.map(results);
        await stream.updateOne(
          { sharedId: entity.sharedId, language: entity.language },
          // @ts-ignore
          { $set: { [`metadata.${property.name}`]: mappedMetadata[property.name] } }
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
  return EntityMappers.toModel({ ...entity, metadata: mappedMetadata });
}

export class MongoEntitiesDataSource
  extends MongoDataSource<EntityDBO>
  // eslint-disable-next-line prettier/prettier
  implements EntitiesDataSource {
  protected collectionName = 'entities';

  private settingsDS: MongoSettingsDataSource;

  protected relationshipsDS: MongoRelationshipsDataSource;

  private templatesDS: MongoTemplatesDataSource;

  constructor(
    db: Db,
    templatesDS: MongoTemplatesDataSource,
    relationshipsDS: MongoRelationshipsDataSource,
    settingsDS: MongoSettingsDataSource,
    transactionManager: MongoTransactionManager
  ) {
    super(db, transactionManager);
    this.templatesDS = templatesDS;
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

  async markMetadataAsChanged(propData: { sharedId: string; property: string }[]) {
    const stream = this.createBulkStream();
    for (let i = 0; i < propData.length; i += 1) {
      const data = propData[i];
      // eslint-disable-next-line no-await-in-loop
      await stream.updateMany(
        { sharedId: data.sharedId },
        { $addToSet: { obsoleteMetadata: data.property } }
      );
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

  async updateDenormalizedTitle(
    properties: string[],
    sharedId: string,
    language: string,
    newTitle: string
  ) {
    const stream = this.createBulkStream();

    await Promise.all(
      properties.map(async property => {
        await stream.updateMany(
          { [`metadata.${property}.value`]: sharedId, language },
          // @ts-ignore
          { $set: { [`metadata.${property}.$[valueIndex].label`]: newTitle } },
          {
            arrayFilters: [{ 'valueIndex.value': sharedId }],
          }
        );
      })
    );

    return stream.flush();
  }

  async updateDenormalizedMetadataValues(
    propertiesToNewValues: { propertyName: string; value: any }[],
    sharedId: string,
    language: string
  ) {
    const stream = this.createBulkStream();

    await Promise.all(
      propertiesToNewValues.map(async ({ propertyName, value }) => {
        await stream.updateMany(
          { [`metadata.${propertyName}.value`]: sharedId, language },
          // @ts-ignore
          {
            $set: {
              [`metadata.${propertyName}.$[valueIndex].inheritedValue`]: value,
            },
          },
          {
            arrayFilters: [{ 'valueIndex.value': sharedId }],
          }
        );
      })
    );

    return stream.flush();
  }

  getByDenormalizedId(properties: string[], sharedIds: string[]): ResultSet<string> {
    const result = this.getCollection().find({
      $or: properties.map(property => ({ [`metadata.${property}.value`]: { $in: sharedIds } })),
    });

    return new MongoResultSet(result, entity => entity.sharedId);
  }
}
