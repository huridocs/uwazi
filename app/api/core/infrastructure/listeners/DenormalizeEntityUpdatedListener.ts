import { Listener } from '#api/core/libs/eventEmitter/Listener.js';
import { PrivilegedJob } from '#api/core/infrastructure/jobs/PrivilegedJob.js';
import { EventEmitterFactory } from '#api/core/libs/eventEmitter/EventEmitterFactory.js';
import { EntityUpdatedEvent } from '#api/core/domain/entity/EntityUpdatedEvent.js';
import { Entity } from '#api/core/domain/entity/Entity.js';
import { denormalizeRelated } from '#api/entities/denormalize.js';
import { TemplatesDataSource } from '#api/core/application/contracts/TemplatesDataSource.js';
import { MongoEntityMapper } from '../mongodb/entity/MongoEntityMapper.js';
import { MongoTemplateMapper } from '../mongodb/template/MongoTemplateMapper.js';
import { HeartbeatCallback, JobInfo } from '#api/core/libs/queue/application/contracts/Dispatchable.js';

type Deps = {
  templatesDS: TemplatesDataSource;
  denormalizeRelated: typeof denormalizeRelated;
};

@PrivilegedJob()
class DenormalizeEntityUpdatedListener extends Listener<EntityUpdatedEvent, Deps> {
  static eventName = EntityUpdatedEvent.name;

  async handle(
    _heartbeat: HeartbeatCallback,
    params: EntityUpdatedEvent['payload'],
    _jobInfo?: JobInfo
  ): Promise<void> {
    const [templateBefore, templateAfter] = await this.deps.templatesDS.getByIds([
      params.before.templateId,
      params.after.templateId,
    ]);

    const beforeEntity = new Entity({ template: templateBefore, ...params.before });
    const afterEntity = new Entity({
      template: templateAfter || templateBefore,
      ...params.after,
    });

    const beforeEntityDbos = MongoEntityMapper.toDBO(beforeEntity);
    const afterEntityDbos = MongoEntityMapper.toDBO(afterEntity);

    const targetEntityDboBefore = beforeEntityDbos.find(
      dbo => dbo.language === params.targetLanguage
    );

    const targetEntityDboAfter = afterEntityDbos.find(
      dbo => dbo.language === params.targetLanguage
    );

    if (!targetEntityDboBefore || !targetEntityDboAfter) {
      throw new Error(
        `Denormalization failed: could not find entity DBO for language ${params.targetLanguage}`
      );
    }

    await this.deps.denormalizeRelated(
      targetEntityDboAfter as any,
      MongoTemplateMapper.toSchema(afterEntity.template),
      targetEntityDboBefore as any
    );
  }
}

EventEmitterFactory.registry.register(DenormalizeEntityUpdatedListener);

export { DenormalizeEntityUpdatedListener };
export type { Deps as DenormalizeEntityUpdatedListenerDeps };
