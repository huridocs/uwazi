import { Listener } from '#api/core/libs/eventEmitter/Listener.js';
import { EventEmitterFactory } from '#api/core/libs/eventEmitter/EventEmitterFactory.js';
import { EntityUpdatedEvent } from '#api/core/domain/entity/EntityUpdatedEvent.js';
import { Entity } from '#api/core/domain/entity/Entity.js';
import { denormalizeRelated } from '#api/entities/denormalize.js';
import { TemplatesDataSource } from '#api/core/application/contracts/TemplatesDataSource.js';
import { MongoEntityMapper } from '../mongodb/entity/MongoEntityMapper.js';
import { MongoTemplateMapper } from '../mongodb/template/MongoTemplateMapper.js';

type Deps = {
  templatesDS: TemplatesDataSource;
  denormalizeRelated: typeof denormalizeRelated;
};

class DenormalizeEntityUpdatedListener extends Listener<EntityUpdatedEvent, Deps> {
  static eventName = EntityUpdatedEvent.name;

  async handle(): Promise<void> {
    const [templateBefore, templateAfter] = await this.deps.templatesDS
      .getByIds([this.params.before.templateId, this.params.after.templateId])
      .all();

    const beforeEntity = new Entity({ template: templateBefore, ...this.params.before });
    const afterEntity = new Entity({
      template: templateAfter || templateBefore,
      ...this.params.after,
    });

    const beforeEntityDbos = MongoEntityMapper.toDBO(beforeEntity);
    const afterEntityDbos = MongoEntityMapper.toDBO(afterEntity);

    const targetEntityDboBefore = beforeEntityDbos.find(
      dbo => dbo.language === this.params.targetLanguage
    );

    const targetEntityDboAfter = afterEntityDbos.find(
      dbo => dbo.language === this.params.targetLanguage
    );

    if (!targetEntityDboBefore || !targetEntityDboAfter) {
      throw new Error(
        `Denormalization failed: could not find entity DBO for language ${this.params.targetLanguage}`
      );
    }

    await this.deps.denormalizeRelated(
      targetEntityDboAfter as any,
      MongoTemplateMapper.toSchema(afterEntity.template),
      targetEntityDboBefore as any
    );
  }
}

EventEmitterFactory.default().listen(DenormalizeEntityUpdatedListener);

export { DenormalizeEntityUpdatedListener };
export type { Deps as DenormalizeEntityUpdatedListenerDeps };
