import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { Queue } from 'api/queue.v2/application/Queue';
import { tenants } from 'api/tenants';
import { search } from 'api/search';
import { EntityRelationshipsUpdateService } from 'api/entities.v2/services/service_factories';
import { UpdateRelationshipPropertiesJob } from '../services/propertyUpdateStrategies/UpdateRelationshipPropertiesJob';
import { UpdateTemplateRelationshipPropertiesJob } from '../services/propertyUpdateStrategies/UpdateTemplateRelationshipPropertiesJob';
import { JobsRouter } from 'api/queue.v2/infrastructure/JobsRouter';
import { StringJobSerializer } from 'api/queue.v2/infrastructure/StringJobSerializer';
import { ApplicationRedisClient } from 'api/queue.v2/infrastructure/ApplicationRedisClient';
import RedisSMQ from 'rsmq';
import { DefaultEntitiesDataSource } from 'api/entities.v2/database/data_source_defaults';

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

export function registerUpdateTemplateRelationshipPropertiesJob(queue: Queue) {
  queue.register(
    UpdateTemplateRelationshipPropertiesJob,
    async namespace =>
      new Promise((resolve, reject) => {
        tenants
          .run(async () => {
            const redisClient = await ApplicationRedisClient.getInstance();
            const RSMQ = new RedisSMQ({ client: redisClient });
            const dispatcher = new JobsRouter(
              queueName =>
                new Queue(queueName, RSMQ, StringJobSerializer, {
                  namespace,
                })
            );

            const entitiesDataSource = DefaultEntitiesDataSource(DefaultTransactionManager());

            resolve({
              dispatcher,
              entitiesDataSource,
            });
          }, namespace)
          .catch(reject);
      })
  );
}
