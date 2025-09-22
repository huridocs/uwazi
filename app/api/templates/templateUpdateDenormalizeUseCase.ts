import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { TemplateUpdateDenormalizeEntitiesBatch } from 'api/core/application/TemplateUpdateDenormalizeEntitiesBatch';
import { TemplatePostProcessEntitiesJob } from 'api/core/infrastructure/jobs/TemplatePostProcessEntitiesJob';
import { MongoMultiLanguageEntityDataSource } from 'api/entities.v2/database/MongoMultiLanguageEntityDataSource';
import { permissionsContext } from 'api/permissions/permissionsContext';
import { JobsDispatcher } from 'api/queue.v2/application/contracts/JobsDispatcher';
import { DefaultDispatcher } from 'api/queue.v2/configuration/factories';
import { SyncDispatcherForTests } from 'api/queue.v2/infrastructure/SyncDispatcherForTests';
import { MongoRelationshipsV1DataSource } from 'api/relationships/MongoRelationshipsV1DataSource';
import { DefaultTemplatesDataSource } from 'api/templates.v2/database/data_source_defaults';
import { Template } from 'api/templates.v2/model/Template';
import { V1RelationshipProperty } from 'api/templates.v2/model/V1RelationshipProperty';
import { tenants } from 'api/tenants';

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
    TemplatePostProcessEntitiesJob: async () =>
      new TemplatePostProcessEntitiesJob({ useCase, templatesDS }),
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
    await dispatcher.dispatch(TemplatePostProcessEntitiesJob, {
      // eslint-disable-next-line no-await-in-loop
      entitiesIds: await resultSet.nextBatch(limit),
      templateId: template.id,
      language,
      modifiedRelationshipsProps: modifiedRelationshipsProps.map(prop => prop.id),
      newGeneratedIdProps: [],
      deletedProperties,
      renamedProperties,
      tenantName: tenants.current().name,
      userId,
    });
  }
};
