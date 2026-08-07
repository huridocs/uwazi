import { Listener } from '#api/core/libs/eventEmitter/Listener.js';
import { PrivilegedJob } from '#api/core/infrastructure/jobs/PrivilegedJob.js';
import { EventEmitterFactory } from '#api/core/libs/eventEmitter/EventEmitterFactory.js';
import { EntityUpdatedEvent } from '#api/core/domain/entity/EntityUpdatedEvent.js';
import { Entity } from '#api/core/domain/entity/Entity.js';
import relationships from '#api/relationships/relationships.js';
import { MongoEntityMapper } from '../mongodb/entity/MongoEntityMapper.js';
import { MongoTemplateMapper } from '../mongodb/template/MongoTemplateMapper.js';
import { TemplatesDataSourceFactory } from '../factories/TemplatesDataSourceFactory.js';
import { TransactionManagerFactory } from '../factories/TransactionManagerFactory.js';
import { HeartbeatCallback, JobInfo } from '#api/core/libs/queue/application/contracts/Dispatchable.js';

@PrivilegedJob()
class ProcessRelationshipAfterEntityUpdatedListener extends Listener<EntityUpdatedEvent> {
  static eventName = EntityUpdatedEvent.name;

  protected async handle(
    _heartbeat: HeartbeatCallback,
    params: EntityUpdatedEvent['payload'],
    _jobInfo?: JobInfo
  ): Promise<void> {
    const templateDS = TemplatesDataSourceFactory.default({
      transactionManager: TransactionManagerFactory.default(),
    });

    const template = (await templateDS.getById(params.after.templateId)).getDataOrThrow();

    const afterEntity = new Entity({ template, ...params.after });

    const afterEntityDbos = MongoEntityMapper.toDBO(afterEntity);

    const targetEntityDboAfter = afterEntityDbos.find(
      dbo => dbo.language === params.targetLanguage
    );

    if (!targetEntityDboAfter) {
      throw new Error(
        // eslint-disable-next-line max-len
        `ProcessRelationshipAfterEntityUpdatedListener: failed to process relationships - could not find entity DBO for language ${params.targetLanguage}`
      );
    }

    await relationships.saveEntityBasedReferences(
      targetEntityDboAfter,
      params.targetLanguage,
      MongoTemplateMapper.toSchema(afterEntity.template)
    );
  }
}

EventEmitterFactory.registry.register(ProcessRelationshipAfterEntityUpdatedListener);

export { ProcessRelationshipAfterEntityUpdatedListener };
