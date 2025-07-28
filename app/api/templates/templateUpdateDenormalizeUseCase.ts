import { UseCase } from 'api/common.v2/contracts/UseCase';
import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { ArrayUtils } from 'api/common.v2/utils/Array';
import { MongoMultiLanguageEntityDataSource } from 'api/entities.v2/database/MongoMultiLanguageEntityDataSource';
import { MultiLanguageEntity } from 'api/entities.v2/model/MultiLanguageEntity';
import { EntityUpdatedEvent } from 'api/entities/events/EntityUpdatedEvent';
import { applicationEventsBus } from 'api/eventsbus';
import { MongoRelationshipsV1DataSource } from 'api/relationships/MongoRelationshipsV1DataSource';
import { RelationsV1Collection } from 'api/relationships/RelationsV1Collection';
import { DefaultTemplatesDataSource } from 'api/templates.v2/database/data_source_defaults';
import { Template } from 'api/templates.v2/model/Template';
import { V1RelationshipProperty } from 'api/templates.v2/model/V1RelationshipProperty';
import { cloneDeep } from 'lodash';

type Input = {
  entities: MultiLanguageEntity[];
  language: string;
  modifiedRelationshipsProps: V1RelationshipProperty[];
};

type Output = any;

type Dependencies = {
  entitiesDS: MongoMultiLanguageEntityDataSource;
  relationshipsV1DS: MongoRelationshipsV1DataSource;
};

class DenormalizeAfterTemplateUpdate implements UseCase<Input, Output> {
  constructor(private dependencies: Dependencies) {}

  async execute({ entities, language, modifiedRelationshipsProps }: Input) {
    const relations = new RelationsV1Collection(
      await this.dependencies.relationshipsV1DS.getByEntitySharedIds(entities.map(e => e.sharedId))
    );

    const modifiedEntities = cloneDeep(entities).map(e =>
      e.createMetadataValuesFromRelationships(modifiedRelationshipsProps, relations)
    );

    const relatedEntities = await (
      await this.dependencies.entitiesDS.getEntitiesByRelatedProperties(
        modifiedEntities,
        modifiedRelationshipsProps
      )
    ).indexed(e => e.sharedId);

    modifiedEntities.forEach(entity => entity.denormalizeRelationshipProps(relatedEntities));

    await ArrayUtils.sequentialFor(entities, async (entity, i) =>
      applicationEventsBus.emit(
        new EntityUpdatedEvent({
          before: entity.getEntitiesAsLegacySchemaArray(),
          after: modifiedEntities[i].getEntitiesAsLegacySchemaArray(),
          targetLanguageKey: language,
        })
      )
    );

    await this.dependencies.entitiesDS.bulkUpdate(modifiedEntities, modifiedRelationshipsProps);
  }
}

export const denormalizeTemplateEntities = async (
  template: Template,
  language: string,
  modifiedRelationshipsProps: V1RelationshipProperty[],
  limit = 200
) => {
  const transactionManager = DefaultTransactionManager();
  const entitiesDS = new MongoMultiLanguageEntityDataSource(
    getConnection(),
    transactionManager,
    DefaultTemplatesDataSource(transactionManager)
  );
  const relationshipsV1DS = new MongoRelationshipsV1DataSource(getConnection(), transactionManager);

  const resultSet = await entitiesDS.getEntitiesByTemplateId(template.id);

  const useCase = new DenormalizeAfterTemplateUpdate({
    entitiesDS,
    relationshipsV1DS,
  });

  // eslint-disable-next-line no-await-in-loop
  while (await resultSet.hasNext()) {
    // eslint-disable-next-line no-await-in-loop
    await useCase.execute({
      // eslint-disable-next-line no-await-in-loop
      entities: await resultSet.nextBatch(limit),
      language,
      modifiedRelationshipsProps,
    });
  }
};
