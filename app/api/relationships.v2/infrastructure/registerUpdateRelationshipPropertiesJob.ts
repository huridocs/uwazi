import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { tenants } from 'api/tenants';
import { search } from 'api/search';
import { EntityRelationshipsUpdateService } from 'api/entities.v2/services/service_factories';
import { DefaultEntitiesDataSource } from 'api/entities.v2/database/data_source_defaults';
import { DefaultDispatcher } from 'api/queue.v2/configuration/factories';
import { QueueWorker } from 'api/queue.v2/infrastructure/QueueWorker';
import { UpdateTemplateRelationshipPropertiesJob } from '../services/propertyUpdateStrategies/UpdateTemplateRelationshipPropertiesJob';
import { UpdateRelationshipPropertiesJob } from '../services/propertyUpdateStrategies/UpdateRelationshipPropertiesJob';

export function registerUpdateRelationshipPropertiesJob(queue: QueueWorker) {
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

            resolve(new UpdateRelationshipPropertiesJob(updater, transactionManager, indexEntity));
          }, namespace)
          .catch(reject);
      })
  );
}

export function registerUpdateTemplateRelationshipPropertiesJob(queue: QueueWorker) {
  queue.register(
    UpdateTemplateRelationshipPropertiesJob,
    async namespace =>
      new Promise((resolve, reject) => {
        tenants
          .run(async () => {
            resolve(
              new UpdateTemplateRelationshipPropertiesJob(
                DefaultEntitiesDataSource(DefaultTransactionManager()),
                await DefaultDispatcher(namespace)
              )
            );
          }, namespace)
          .catch(reject);
      })
  );
}
