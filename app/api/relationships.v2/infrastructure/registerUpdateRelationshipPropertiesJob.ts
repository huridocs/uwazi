import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { DefaultEntitiesDataSource } from 'api/entities.v2/database/data_source_defaults';
import { EntityRelationshipsUpdateService } from 'api/entities.v2/services/EntityRelationshipsUpdateService';
import { Queue } from 'api/queue.v2/application/Queue';
import { DefaultTemplatesDataSource } from 'api/templates.v2/database/data_source_defaults';
import { tenants } from 'api/tenants';
import { search } from 'api/search';
import { DefaultRelationshipDataSource } from '../database/data_source_defaults';
import { UpdateRelationshipPropertiesJob } from '../services/propertyUpdateStrategies/UpdateRelationshipPropertiesJob';

export function registerUpdateRelationshipPropertiesJob(queue: Queue) {
  queue.register(
    UpdateRelationshipPropertiesJob,
     async namespace =>
      new Promise((resolve, reject) => {
        tenants
          .run(async () => {
            const transactionManager = DefaultTransactionManager();
            const relationshipsDS = DefaultRelationshipDataSource(transactionManager);
            const entitiesDS = DefaultEntitiesDataSource(transactionManager);
            const templatesDS = DefaultTemplatesDataSource(transactionManager);

            resolve({
              updater: new EntityRelationshipsUpdateService(
                entitiesDS,
                templatesDS,
                relationshipsDS
              ),
              indexEntity: async (sharedId: string) =>
                tenants.run(async () => search.indexEntities({ sharedId }), namespace),
              transactionManager,
            });
          }, namespace)
          .catch(reject);
      })
    );
}