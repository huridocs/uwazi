import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { Queue } from 'api/queue.v2/application/Queue';
import { tenants } from 'api/tenants';
import { search } from 'api/search';
import { EntityRelationshipsUpdateService } from 'api/entities.v2/services/service_factories';
import { DefaultEntitiesDataSource } from 'api/entities.v2/database/data_source_defaults';
import { DefaultDispatcher } from 'api/queue.v2/configuration/factories';
import { UpdateTemplateRelationshipPropertiesJob } from '../services/propertyUpdateStrategies/UpdateTemplateRelationshipPropertiesJob';
import { UpdateRelationshipPropertiesJob } from '../services/propertyUpdateStrategies/UpdateRelationshipPropertiesJob';

export function registerUpdateRelationshipPropertiesJob(queue: Queue) {
  queue.register(
    UpdateRelationshipPropertiesJob,
    async namespace =>
      new Promise((resolve, reject) => {
        tenants
          .run(async () => {
            const transactionManager = DefaultTransactionManager();
            const updater = EntityRelationshipsUpdateService(transactionManager);
            const indexEntity = async (sharedIds: string[]) =>
              tenants.run(
                async () => search.indexEntities({ sharedId: { $in: sharedIds } }),
                namespace
              );

            resolve({
              updater,
              indexEntity,
              transactionManager,
            });
          }, namespace)
          .catch(reject);
      })
  );
}

export function registerUpdateTemplateRelationshipPropertiesJob(queue: Queue) {
  queue.register(
    UpdateTemplateRelationshipPropertiesJob,
    async namespace =>
      new Promise((resolve, reject) => {
        tenants
          .run(async () => {
            resolve({
              dispatcher: await DefaultDispatcher(namespace),
              entitiesDataSource: DefaultEntitiesDataSource(DefaultTransactionManager()),
            });
          }, namespace)
          .catch(reject);
      })
  );
}
