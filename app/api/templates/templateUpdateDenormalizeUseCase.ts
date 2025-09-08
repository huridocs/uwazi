import { TransactionManager } from 'api/common.v2/contracts/TransactionManager';
import { UseCase } from 'api/common.v2/contracts/UseCase';
import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { ArrayUtils } from 'api/common.v2/utils/Array';
import { MultiLanguageEntityDataSource } from 'api/entities.v2/contracts/MultiLanguageEntitiesDataSource';
import { MongoMultiLanguageEntityDataSource } from 'api/entities.v2/database/MongoMultiLanguageEntityDataSource';
import { EntityUpdatedEvent } from 'api/entities/events/EntityUpdatedEvent';
import { applicationEventsBus } from 'api/eventsbus';
import { PXCreateParagraphsJob } from 'api/paragraphExtraction/infrastructure/PXCreateParagraphsJob';
import { permissionsContext } from 'api/permissions/permissionsContext';
import { JobsDispatcher } from 'api/queue.v2/application/contracts/JobsDispatcher';
import {
  UserAwareDispatchable,
  UserAwareDispatchableParams,
} from 'api/queue.v2/application/contracts/UserAwareDispatchable';
import { DefaultDispatcher } from 'api/queue.v2/configuration/factories';
import { SyncDispatcherForTests } from 'api/queue.v2/infrastructure/SyncDispatcherForTests';
import { MongoRelationshipsV1DataSource } from 'api/relationships/MongoRelationshipsV1DataSource';
import { RelationsV1Collection } from 'api/relationships/RelationsV1Collection';
import { emitToTenant } from 'api/socketio/setupSockets';
import { TemplatesDataSource } from 'api/templates.v2/contracts/TemplatesDataSource';
import { DefaultTemplatesDataSource } from 'api/templates.v2/database/data_source_defaults';
import { Template } from 'api/templates.v2/model/Template';
import { V1RelationshipProperty } from 'api/templates.v2/model/V1RelationshipProperty';
import { tenants } from 'api/tenants';
import { cloneDeep } from 'lodash';

type Input = {
  entitiesIds: string[];
  language: string;
  modifiedRelationshipsProps: string[];
  deletedProperties: string[];
  renamedProperties: { [oldName: string]: string };
  templateId: string;
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
    deletedProperties,
    renamedProperties,
    templateId,
    onAllEntitiesDenormalized,
    onProgress,
  }: Input) {
    await this.dependencies.transactionManager.run(async () => {
      await this.dependencies.entitiesDS.deleteMetadataProperties(deletedProperties, entitiesIds);
      await this.dependencies.entitiesDS.renameMetadataProperties(renamedProperties, entitiesIds);

      if (modifiedRelationshipsProps.length) {
        const relationshipProps = await this.dependencies.templatesDS
          .getV1RelationshipPropertiesByIds(modifiedRelationshipsProps)
          .all();

        const entities = await (
          await this.dependencies.entitiesDS.getEntitiesBySharedIds(entitiesIds)
        ).all();

        const relations = new RelationsV1Collection(
          await this.dependencies.relationshipsV1DS.getByEntitySharedIds(
            entities.map(e => e.sharedId)
          )
        );

        const modifiedEntities = cloneDeep(entities).map(e =>
          e.createMetadataValuesFromRelationships(relationshipProps, relations)
        );

        const relatedEntities = await (
          await this.dependencies.entitiesDS.getEntitiesByRelatedProperties(
            modifiedEntities,
            relationshipProps
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

        await this.dependencies.entitiesDS.bulkUpdate(modifiedEntities, relationshipProps);
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

type DenormalizeV1RelationshipsJobParams = UserAwareDispatchableParams & {
  entitiesIds: string[];
  templateId: string;
  language: string;
  modifiedRelationshipsProps: string[];
  deletedProperties: string[];
  renamedProperties: { [oldName: string]: string };
};

type JobDependencies = {
  useCase: TemplateUpdateDenormalizeEntitiesBatch;
  templatesDS: TemplatesDataSource;
};

export class DenormalizeV1RelationshipsJob extends UserAwareDispatchable<DenormalizeV1RelationshipsJobParams> {
  public constructor(private dependencies: JobDependencies) {
    super();
  }

  async handle() {
    await this.dependencies.useCase.execute({
      entitiesIds: this.params.entitiesIds,
      language: this.params.language,
      modifiedRelationshipsProps: this.params.modifiedRelationshipsProps,
      deletedProperties: this.params.deletedProperties,
      renamedProperties: this.params.renamedProperties,
      templateId: this.params.templateId,
      onAllEntitiesDenormalized: () =>
        emitToTenant(this.tenantName, 'templateProcessed', { templateId: this.params.templateId }),
      onProgress: (processing: { active: boolean; totalJobs: number; completedJobs: number }) =>
        emitToTenant(this.tenantName, 'templateProcessing', {
          templateId: this.params.templateId,
          processing,
        }),
    });
  }
}

export { PXCreateParagraphsJob };

export const denormalizeTemplateEntities = async (
  template: Template,
  language: string,
  modifiedRelationshipsProps: V1RelationshipProperty[],
  deletedProperties: string[],
  renamedProperties: { [oldName: string]: string },
  limit = 200
) => {
  const transactionManager = DefaultTransactionManager();
  const entitiesDS = new MongoMultiLanguageEntityDataSource(
    getConnection(),
    transactionManager,
    DefaultTemplatesDataSource(transactionManager)
  );
  const relationshipsV1DS = new MongoRelationshipsV1DataSource(getConnection(), transactionManager);
  const templatesDS = DefaultTemplatesDataSource(transactionManager);

  const useCase = new TemplateUpdateDenormalizeEntitiesBatch({
    entitiesDS,
    relationshipsV1DS,
    templatesDS,
    transactionManager,
  });

  let dispatcher: JobsDispatcher = new SyncDispatcherForTests({
    DenormalizeV1RelationshipsJob: async () =>
      new DenormalizeV1RelationshipsJob({ useCase, templatesDS }),
  });

  if (process.env.NODE_ENV !== 'test') {
    dispatcher = await DefaultDispatcher(tenants.current().name);
  }

  const userId = permissionsContext.getUserInContext()?._id?.toString();
  if (!userId) {
    throw new Error('This process can not be started without a user');
  }

  const resultSet = await entitiesDS.getSharedIdsByTemplateId(template.id);
  const totalJobs = Math.ceil((await entitiesDS.countByTemplateId(template.id)) / limit);
  await templatesDS.setProcessingTotalJobs(template.id, totalJobs);

  // eslint-disable-next-line no-await-in-loop
  while (await resultSet.hasNext()) {
    // eslint-disable-next-line no-await-in-loop
    await dispatcher.dispatch(DenormalizeV1RelationshipsJob, {
      // eslint-disable-next-line no-await-in-loop
      entitiesIds: await resultSet.nextBatch(limit),
      templateId: template.id,
      language,
      modifiedRelationshipsProps: modifiedRelationshipsProps.map(prop => prop.id),
      deletedProperties,
      renamedProperties,
      tenantName: tenants.current().name,
      userId,
    });
  }
};
