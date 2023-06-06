import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { Queue } from 'api/queue.v2/application/Queue';
import { tenants } from 'api/tenants';
import { search } from 'api/search';
import { EntityRelationshipsUpdateService } from 'api/entities.v2/services/service_factories';
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
            const indexEntity = async (sharedId: string) =>
              tenants.run(async () => search.indexEntities({ sharedId }), namespace);

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
