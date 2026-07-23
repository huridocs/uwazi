import { Db, ObjectId } from 'mongodb';
import { ResultSet } from '#api/core/application/contracts/ResultSet.js';
import { MongoDataSource } from '#api/core/infrastructure/mongodb/common/MongoDataSource.js';
import { MongoIdHandler } from '#api/core/infrastructure/mongodb/common/MongoIdGenerator.js';
import { MongoResultSet } from '#api/core/infrastructure/mongodb/common/MongoResultSet.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import { TemplatesDataSource } from '#api/core/application/contracts/TemplatesDataSource.js';
import { DeprecatedEntitiesDataSource } from '../contracts/DeprecatedEntitiesDataSource.js';
import { DeprecatedEntity, EntityMetadata } from '../model/Entity.js';
import { EntityMappers } from './EntityMapper.js';
import { EntityDBO } from '#api/core/infrastructure/mongodb/entity/EntityDBO.js';

export class MongoDeprecatedEntitiesDataSource
  extends MongoDataSource<EntityDBO>
  implements DeprecatedEntitiesDataSource
{
  protected collectionName = 'entities';

  private settingsDS: SettingsDataSource;

  protected templatesDS: TemplatesDataSource;

  constructor(
    db: Db,
    templatesDS: TemplatesDataSource,
    settingsDS: SettingsDataSource,
    transactionManager: MongoTransactionManager
  ) {
    super(db, transactionManager);
    this.templatesDS = templatesDS;
    this.settingsDS = settingsDS;
  }

  async entitiesExist(sharedIds: string[]) {
    const languages = await this.settingsDS.getLanguageKeys();
    const countInExistence = await this.getCollection().countDocuments({
      sharedId: { $in: sharedIds },
    });
    return countInExistence === sharedIds.length * languages.length;
  }

  async markMetadataAsChanged(
    propData: Parameters<DeprecatedEntitiesDataSource['markMetadataAsChanged']>[0]
  ) {
    const stream = this.createBulkStream();
    for (let i = 0; i < propData.length; i += 1) {
      const data = propData[i];

      const filter =
        'template' in data
          ? { template: MongoIdHandler.mapToDb(data.template) }
          : { sharedId: data.sharedId };
      const update = 'properties' in data ? { $each: data.properties } : data.property;

      // eslint-disable-next-line no-await-in-loop
      await stream.updateMany(filter, { $addToSet: { obsoleteMetadata: update } });
    }
    await stream.flush();
  }

  getByIds(sharedIds: string[], language?: string) {
    const match: { sharedId: { $in: string[] }; language?: string } = {
      sharedId: { $in: sharedIds },
    };
    if (language) match.language = language;
    const cursor = this.getCollection().find(match);

    return new MongoResultSet(cursor, async entity => EntityMappers.toModel(entity));
  }

  getIdsByTemplate(templateId: string): ResultSet<string> {
    const cursor = this.getCollection().find({ template: MongoIdHandler.mapToDb(templateId) });
    return new MongoResultSet(cursor, async entity => entity.sharedId);
  }

  async updateDenormalizedMetadataValues(
    sharedId: string,
    language: string,
    title: string,
    propertiesToNewValues: { propertyName: string; value?: any }[]
  ) {
    const stream = this.createBulkStream();

    await Promise.all(
      propertiesToNewValues.map(async ({ propertyName, value }) => {
        await stream.updateMany(
          { [`metadata.${propertyName}.value`]: sharedId, language },
          // @ts-ignore
          {
            $set: {
              [`metadata.${propertyName}.$[valueIndex].label`]: title,
              ...(value
                ? { [`metadata.${propertyName}.$[valueIndex].inheritedValue`]: value }
                : {}),
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

  async updateObsoleteMetadataValues(
    id: DeprecatedEntity['_id'],
    values: Record<string, EntityMetadata[]>
  ): Promise<void> {
    const stream = this.createBulkStream();

    await stream.updateOne(
      { _id: MongoIdHandler.mapToDb(id) },
      {
        $set: Object.fromEntries(
          Object.entries(values).map(([propertyName, metadataValues]) => [
            `metadata.${propertyName}`,
            metadataValues,
          ])
        ),
      }
    );
    await stream.updateOne(
      { _id: MongoIdHandler.mapToDb(id) },
      { $pull: { obsoleteMetadata: { $in: Object.keys(values) } } }
    );

    await stream.flush();
  }

  getObsoleteMetadata(sharedIds: string[], language: string) {
    const cursor = this.getCollection().find(
      { sharedId: { $in: sharedIds }, language },
      { projection: { sharedId: 1, obsoleteMetadata: 1 } }
    );

    return new MongoResultSet(cursor, result => ({
      sharedId: result.sharedId,
      obsoleteMetadata: result.obsoleteMetadata ?? [],
    }));
  }

  async anyExistsForTemplate(templateId: string): Promise<boolean> {
    const count = await this.getCollection().countDocuments(
      {
        template: ObjectId.createFromHexString(templateId),
      },
      { limit: 1 }
    );

    return count > 0;
  }
}
