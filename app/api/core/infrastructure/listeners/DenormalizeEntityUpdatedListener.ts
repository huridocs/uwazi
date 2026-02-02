import { Listener } from 'api/core/libs/eventEmitter/Listener';
import { EventEmitterFactory } from 'api/core/libs/eventEmitter/EventEmitterFactory';
import { EntityUpdatedEvent } from 'api/core/domain/entity/EntityUpdatedEvent';
import { Entity } from 'api/core/domain/entity/Entity';
import { denormalizeRelated } from 'api/entities/denormalize';
import { TemplatesDataSourceFactory } from 'api/core/infrastructure/factories/TemplatesDataSourceFactory';
import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { MongoEntityMapper } from '../mongodb/entity/MongoEntityMapper';
import { MongoTemplateMapper } from '../mongodb/template/MongoTemplateMapper';

class DenormalizeEntityUpdatedListener extends Listener<EntityUpdatedEvent> {
  static eventName = EntityUpdatedEvent.name;

  protected async handle(): Promise<void> {
    const transactionManager = TransactionManagerFactory.default();
    const templateDS = TemplatesDataSourceFactory.default(transactionManager);

    const [templateBefore, templateAfter] = await templateDS
      .getByIds([this.params.before.templateId, this.params.after.templateId])
      .all();

    const beforeEntity = new Entity({ template: templateBefore, ...this.params.before });
    const afterEntity = new Entity({ template: templateAfter, ...this.params.after });

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

    await denormalizeRelated(
      targetEntityDboAfter as any,
      MongoTemplateMapper.toSchema(templateAfter),
      targetEntityDboBefore as any
    );
  }
}

EventEmitterFactory.default().listen(DenormalizeEntityUpdatedListener);

export { DenormalizeEntityUpdatedListener };
