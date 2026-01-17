import { DefaultTransactionManager } from '#api/common.v2/database/data_source_defaults.js';
import { getConnection } from '#api/common.v2/database/getConnectionForCurrentTenant.js';
import { TemplateUpdateDenormalizeEntitiesBatch } from '#api/core/application/TemplateUpdateDenormalizeEntitiesBatch.js';
import { TemplatePostProcessEntitiesJob } from '#api/core/infrastructure//jobs/TemplatePostProcessEntitiesJob.js';
import { MongoMultiLanguageEntityDataSource } from '#api/entities.v2/database/MongoMultiLanguageEntityDataSource.js';
import { permissionsContext } from '#api/permissions/permissionsContext.js';
import { JobsDispatcher } from '../queue.v2/application/contracts/JobsDispatcher.js';
import { DefaultDispatcher } from '../queue.v2/configuration/factories.js';
import { SyncDispatcherForTests } from '../queue.v2/infrastructure/SyncDispatcherForTests.js';
import { MongoRelationshipsV1DataSource } from '../relationships/MongoRelationshipsV1DataSource.js';
import { DefaultTemplatesDataSource } from '#api/templates.v2/database/data_source_defaults.js';
import { Template } from '#api/core/domain/template/Template.js';
import { V1RelationshipProperty } from '#api/core/domain/template/V1RelationshipProperty.js';
import { tenants } from '../tenants/index.js';

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
      fullReindex: false,
      tenantName: tenants.current().name,
      userId,
    });
  }
};
