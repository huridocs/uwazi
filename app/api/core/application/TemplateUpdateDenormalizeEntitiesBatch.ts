import { TransactionManager } from 'api/common.v2/contracts/TransactionManager';
import { UseCase } from 'api/common.v2/contracts/UseCase';
import { ArrayUtils } from 'api/common.v2/utils/Array';
import { MultiLanguageEntityDataSource } from 'api/entities.v2/contracts/MultiLanguageEntitiesDataSource';
import { EntityUpdatedEvent } from 'api/entities/events/EntityUpdatedEvent';
import { applicationEventsBus } from 'api/eventsbus';
import { MongoRelationshipsV1DataSource } from 'api/relationships/MongoRelationshipsV1DataSource';
import { RelationsV1Collection } from 'api/relationships/RelationsV1Collection';
import { search } from 'api/search';
import { TemplatesDataSource } from 'api/templates.v2/contracts/TemplatesDataSource';
import { cloneDeep } from 'lodash';
import { generateID } from 'shared/IDGenerator';

type Input = {
  entitiesIds: string[];
  language: string;
  modifiedRelationshipsProps: string[];
  newGeneratedIdProps: string[];
  deletedProperties: string[];
  renamedProperties: { [oldName: string]: string };
  templateId: string;
  fullReindex: boolean;
  onAllEntitiesDenormalized: () => void;
  onProgress: (progress: { active: boolean; totalJobs: number; completedJobs: number }) => void;
};

type Output = any;

type Dependencies = {
  entitiesDS: MultiLanguageEntityDataSource;
  relationshipsV1DS: MongoRelationshipsV1DataSource;
  templatesDS: TemplatesDataSource;
  transactionManager: TransactionManager;
};

export class TemplateUpdateDenormalizeEntitiesBatch implements UseCase<Input, Output> {
  constructor(private dependencies: Dependencies) {}

  async execute({
    entitiesIds,
    language,
    modifiedRelationshipsProps,
    newGeneratedIdProps,
    deletedProperties,
    renamedProperties,
    templateId,
    fullReindex,
    onAllEntitiesDenormalized,
    onProgress,
  }: Input) {
    if (fullReindex) {
      await search.indexEntities({ sharedId: { $in: entitiesIds } }, '+fullText', 10);
    }
    await this.dependencies.transactionManager.run(async () => {
      await this.dependencies.entitiesDS.deleteMetadataProperties(deletedProperties, entitiesIds);
      await this.dependencies.entitiesDS.renameMetadataProperties(renamedProperties, entitiesIds);

      if (modifiedRelationshipsProps.length || newGeneratedIdProps.length) {
        const entities = await (
          await this.dependencies.entitiesDS.getEntitiesBySharedIds(entitiesIds)
        ).all();
        const relationshipProps = await this.dependencies.templatesDS
          .getV1RelationshipPropertiesByIds(modifiedRelationshipsProps)
          .all();

        const generatedIdProps = await this.dependencies.templatesDS
          .getGeneratedIdPropertiesByIds(newGeneratedIdProps)
          .all();
        const modifiedEntities = cloneDeep(entities);

        if (relationshipProps.length) {
          const relations = new RelationsV1Collection(
            await this.dependencies.relationshipsV1DS.getByEntitySharedIds(
              entities.map(e => e.sharedId)
            )
          );
          modifiedEntities.map(e =>
            e.createMetadataValuesFromRelationships(relationshipProps, relations)
          );
          const relatedEntities = await (
            await this.dependencies.entitiesDS.getEntitiesByRelatedProperties(
              modifiedEntities,
              relationshipProps
            )
          ).indexed(e => e.sharedId);
          modifiedEntities.forEach(entity => entity.denormalizeRelationshipProps(relatedEntities));
        }

        if (generatedIdProps.length) {
          modifiedEntities.forEach(entity => {
            generatedIdProps.forEach(prop => {
              entity.translations.setValueInAllLanguages(prop.name, [
                { value: generateID(3, 4, 4), label: '' },
              ]);
            });
          });
        }

        await ArrayUtils.sequentialFor(entities, async (entity, i) =>
          applicationEventsBus.emit(
            new EntityUpdatedEvent({
              before: entity.getEntitiesAsLegacySchemaArray(),
              after: modifiedEntities[i].getEntitiesAsLegacySchemaArray(),
              targetLanguageKey: language,
            })
          )
        );

        await this.dependencies.entitiesDS.bulkUpdate(modifiedEntities, [
          ...relationshipProps,
          ...generatedIdProps,
        ]);
      }
    });
    const jobs = await this.dependencies.templatesDS.incrementProcessingTracking(templateId);
    if (jobs.total === jobs.completed) {
      await this.dependencies.templatesDS.completeProcessing(templateId);
      onAllEntitiesDenormalized();
    } else if (jobs.completed % 10 === 0) {
      onProgress({ active: true, totalJobs: jobs.total, completedJobs: jobs.completed });
    }
  }
}
